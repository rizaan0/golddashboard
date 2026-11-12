const colorLib = `
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
const vec3 WHITE = vec3(0.95045592705, 1.0, 1.08905775076);
const mat3 RGB_TO_XYZ_M = mat3(0.4124, 0.3576, 0.1805, 0.2126, 0.7152, 0.0722, 0.0193, 0.1192, 0.9505);
const mat3 XYZ_TO_RGB_M = mat3(3.2406255, -1.537208, -0.4986286, -0.9689307, 1.8757561, 0.0415175, 0.0557101, -0.2040211, 1.0569959);
float UNCOMPAND_SRGB(float a) { return a > 0.04045 ? pow((a + 0.055) / 1.055, 2.4) : a / 12.92; }
float COMPAND_RGB(float a) { return a <= 0.0031308 ? 12.92 * a : 1.055 * pow(a, 0.41666666666) - 0.055; }
vec3 SRGB_TO_RGB(vec3 srgb) { return vec3(UNCOMPAND_SRGB(srgb.x), UNCOMPAND_SRGB(srgb.y), UNCOMPAND_SRGB(srgb.z)); }
vec3 RGB_TO_SRGB(vec3 rgb) { return vec3(COMPAND_RGB(rgb.x), COMPAND_RGB(rgb.y), COMPAND_RGB(rgb.z)); }
float XYZ_TO_LAB_F(float x) { return x > 0.00885645167 ? pow(x, 0.333333333) : 7.78703703704 * x + 0.13793103448; }
vec3 SRGB_TO_LCH(vec3 srgb) {
  vec3 xyz = SRGB_TO_RGB(srgb) * RGB_TO_XYZ_M;
  vec3 scaled = xyz / WHITE;
  scaled = vec3(XYZ_TO_LAB_F(scaled.x), XYZ_TO_LAB_F(scaled.y), XYZ_TO_LAB_F(scaled.z));
  vec3 lab = vec3(116.0 * scaled.y - 16.0, 500.0 * (scaled.x - scaled.y), 200.0 * (scaled.y - scaled.z));
  return vec3(lab.x, sqrt(dot(lab.yz, lab.yz)), atan(lab.z, lab.y) * 57.2957795131);
}
float LAB_TO_XYZ_F(float x) { return x > 0.206897 ? x * x * x : 0.12841854934 * (x - 0.137931034); }
vec3 LCH_TO_SRGB(vec3 lch) {
  vec3 lab = vec3(lch.x, lch.y * cos(lch.z * 0.01745329251), lch.y * sin(lch.z * 0.01745329251));
  float w = (lab.x + 16.0) / 116.0;
  vec3 xyz = WHITE * vec3(LAB_TO_XYZ_F(w + lab.y / 500.0), LAB_TO_XYZ_F(w), LAB_TO_XYZ_F(w - lab.z / 200.0));
  return RGB_TO_SRGB(xyz * XYZ_TO_RGB_M);
}
`;

const sdfLib = `
float sdCircle(vec2 p, float r) { return length(p) - r; }
float superellipseCornerSDF(vec2 p, float r, float n) {
  p = abs(p);
  return pow(pow(p.x, n) + pow(p.y, n), 1.0 / n) - r;
}
float roundedRectSDF(vec2 p, vec2 center, float width, float height, float cornerRadius, float n) {
  p -= center;
  float cr = cornerRadius * u_dpr;
  vec2 d = abs(p) - vec2(width * u_dpr, height * u_dpr) * 0.5;
  float dist;
  if (d.x > -cr && d.y > -cr) {
    vec2 cornerCenter = sign(p) * (vec2(width * u_dpr, height * u_dpr) * 0.5 - vec2(cr));
    dist = superellipseCornerSDF(p - cornerCenter, cr, n);
  } else {
    dist = min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
  }
  return dist;
}
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
float mainSDF(vec2 p1, vec2 p2, vec2 p) {
  vec2 p1n = p1 + p / u_resolution.y;
  vec2 p2n = p2 + p / u_resolution.y;
  float d1 = u_showShape1 == 1 ? sdCircle(p1n, 100.0 * u_dpr / u_resolution.y) : 1.0;
  float d2 = roundedRectSDF(p2n, vec2(0.0), u_shapeWidth / u_resolution.y, u_shapeHeight / u_resolution.y, u_shapeRadius / u_resolution.y, u_shapeRoundness);
  return smin(d1, d2, u_mergeRate);
}
`;

const shapeUniforms = `
uniform vec2 u_resolution;
uniform float u_dpr;
uniform vec2 u_mouse;
uniform vec2 u_mouseSpring;
uniform float u_mergeRate;
uniform float u_shapeWidth;
uniform float u_shapeHeight;
uniform float u_shapeRadius;
uniform float u_shapeRoundness;
uniform int u_showShape1;
`;

export const vertexShader = `#version 300 es
in vec4 a_position;
out vec2 v_uv;
void main() {
  v_uv = (a_position.xy + 1.0) * 0.5;
  gl_Position = a_position;
}
`;

export const backgroundShader = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
${shapeUniforms}
uniform float u_time;
uniform float u_shadowExpand;
uniform float u_shadowFactor;
uniform vec2 u_shadowPosition;
uniform int u_bgType;
uniform sampler2D u_bgTexture;
uniform float u_bgTextureRatio;
uniform int u_bgTextureReady;
${sdfLib}
vec2 getCoverUV(vec2 uv, float canvasAspect, float textureAspect) {
  if (canvasAspect > textureAspect) {
    float scale = textureAspect / canvasAspect;
    uv.y = uv.y * scale + 0.5 - 0.5 * scale;
  } else {
    float scale = canvasAspect / textureAspect;
    uv.x = uv.x * scale + 0.5 - 0.5 * scale;
  }
  return uv;
}
void main() {
  vec2 u_resolution1x = u_resolution.xy / u_dpr;
  vec3 bgColor = vec3(1.0);
  if (u_bgTextureReady == 1) {
    bgColor = texture(u_bgTexture, getCoverUV(v_uv, u_resolution.x / u_resolution.y, u_bgTextureRatio)).rgb;
  }
  vec2 p1 = (vec2(0.0) - u_resolution.xy * 0.5 + vec2(u_shadowPosition.x * u_dpr, u_shadowPosition.y * u_dpr)) / u_resolution.y;
  vec2 p2 = (vec2(0.0) - u_mouseSpring + vec2(u_shadowPosition.x * u_dpr, u_shadowPosition.y * u_dpr)) / u_resolution.y;
  float merged = mainSDF(p1, p2, gl_FragCoord.xy);
  float shadow = exp(-1.0 / u_shadowExpand * abs(merged) * u_resolution1x.y) * 0.6 * u_shadowFactor;
  fragColor = vec4(bgColor - vec3(shadow), 1.0);
}
`;

export const verticalBlurShader = `#version 300 es
precision highp float;
#define MAX_BLUR_RADIUS 8
in vec2 v_uv;
uniform sampler2D u_prevPassTexture;
uniform vec2 u_resolution;
uniform int u_blurRadius;
uniform float u_blurWeights[MAX_BLUR_RADIUS + 1];
out vec4 fragColor;
void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 color = texture(u_prevPassTexture, v_uv) * u_blurWeights[0];
  for (int i = 1; i <= MAX_BLUR_RADIUS; ++i) {
    if (i > u_blurRadius) break;
    float w = u_blurWeights[i];
    vec2 offset = vec2(float(i)) * texelSize;
    color += texture(u_prevPassTexture, v_uv + vec2(offset.x, 0.0)) * w;
    color += texture(u_prevPassTexture, v_uv - vec2(offset.x, 0.0)) * w;
  }
  fragColor = color;
}
`;

export const horizontalBlurShader = `#version 300 es
precision highp float;
#define MAX_BLUR_RADIUS 8
in vec2 v_uv;
uniform sampler2D u_prevPassTexture;
uniform vec2 u_resolution;
uniform int u_blurRadius;
uniform float u_blurWeights[MAX_BLUR_RADIUS + 1];
out vec4 fragColor;
void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 color = texture(u_prevPassTexture, v_uv) * u_blurWeights[0];
  for (int i = 1; i <= MAX_BLUR_RADIUS; ++i) {
    if (i > u_blurRadius) break;
    float w = u_blurWeights[i];
    vec2 offset = vec2(float(i)) * texelSize;
    color += texture(u_prevPassTexture, v_uv + vec2(0.0, offset.y)) * w;
    color += texture(u_prevPassTexture, v_uv - vec2(0.0, offset.y)) * w;
  }
  fragColor = color;
}
`;

export const mainShader = `#version 300 es
precision highp float;
const float N_R = 1.0 - 0.02;
const float N_G = 1.0;
const float N_B = 1.0 + 0.02;
in vec2 v_uv;
out vec4 fragColor;
${shapeUniforms}
uniform sampler2D u_blurredBg;
uniform sampler2D u_bg;
uniform vec4 u_tint;
uniform float u_refThickness;
uniform float u_refDistance;
uniform float u_refFactor;
uniform float u_refDispersion;
uniform float u_refFresnelRange;
uniform float u_refFresnelFactor;
uniform float u_refFresnelHardness;
uniform float u_glareRange;
uniform float u_glareConvergence;
uniform float u_glareOppositeFactor;
uniform float u_glareFactor;
uniform float u_glareHardness;
uniform float u_glareAngle;
uniform int u_blurEdge;
uniform float u_shadowExpand;
uniform float u_shadowFactor;
uniform vec2 u_shadowPosition;
uniform float u_rim;
${colorLib}
float safeAsin(float x) { return asin(clamp(x, -1.0, 1.0)); }
${sdfLib}
// Studio getNormal, with a 1px step. dFdx(gl_FragCoord) is 0 on ANGLE/D3D11, which collapsed the bend.
vec2 getNormal(vec2 p1, vec2 p2, vec2 p) {
  vec2 h = vec2(1.0, 0.0);
  vec2 grad = vec2(
    mainSDF(p1, p2, p + h.xy) - mainSDF(p1, p2, p - h.xy),
    mainSDF(p1, p2, p + h.yx) - mainSDF(p1, p2, p - h.yx)
  ) * 0.5;
  return grad * 1.414213562 * 1000.0;
}
vec4 getTextureDispersion(sampler2D tex1, sampler2D tex2, float mixRate, vec2 offset, float factor) {
  float bgR = texture(tex1, v_uv + offset * (1.0 - (N_R - 1.0) * factor)).r;
  float bgG = texture(tex1, v_uv + offset * (1.0 - (N_G - 1.0) * factor)).g;
  float bgB = texture(tex1, v_uv + offset * (1.0 - (N_B - 1.0) * factor)).b;
  float blurR = texture(tex2, v_uv + offset * (1.0 - (N_R - 1.0) * factor)).r;
  float blurG = texture(tex2, v_uv + offset * (1.0 - (N_G - 1.0) * factor)).g;
  float blurB = texture(tex2, v_uv + offset * (1.0 - (N_B - 1.0) * factor)).b;
  return vec4(mix(bgR, blurR, mixRate), mix(bgG, blurG, mixRate), mix(bgB, blurB, mixRate), 1.0);
}
void main() {
  vec2 u_resolution1x = u_resolution.xy / u_dpr;
  vec2 p1 = (vec2(0.0) - u_resolution.xy * 0.5) / u_resolution.y;
  vec2 p2 = (vec2(0.0) - u_mouseSpring) / u_resolution.y;
  float merged = mainSDF(p1, p2, gl_FragCoord.xy);
  float aa = 1.5 / max(u_resolution.y, 1.0);
  float coverage = smoothstep(aa, -aa, merged);
  vec4 outColor = vec4(0.0);
  if (coverage > 0.001) {
    float nmerged = max(0.0, -1.0 * (merged * u_resolution1x.y));
    float x_R_ratio = 1.0 - nmerged / u_refThickness;
    float thetaI = safeAsin(pow(x_R_ratio, 2.0));
    float thetaT = safeAsin(1.0 / u_refFactor * sin(thetaI));
    float edgeFactor = -1.0 * tan(thetaT - thetaI);
    if (nmerged >= u_refThickness) edgeFactor = 0.0;
    edgeFactor *= smoothstep(0.0, 3.0, nmerged);
    if (edgeFactor <= 0.0) {
      outColor = texture(u_blurredBg, v_uv);
      outColor = mix(outColor, vec4(u_tint.rgb, 1.0), u_tint.a * 0.8);
    } else {
      float edgeH = nmerged / u_refThickness;
      vec2 normal = getNormal(p1, p2, gl_FragCoord.xy);
      vec4 blurredPixel = getTextureDispersion(
        u_bg,
        u_blurredBg,
        u_blurEdge > 0 ? 1.0 : edgeH,
        -normal * edgeFactor * u_refDistance * u_dpr * vec2(u_resolution.y / (u_resolution1x.x * u_dpr), 1.0),
        u_refDispersion
      );
      outColor = mix(blurredPixel, vec4(u_tint.rgb, 1.0), u_tint.a * 0.8);
    }
    float rim = smoothstep(2.6, 0.15, nmerged);
    outColor.rgb = mix(outColor.rgb, vec3(0.93, 0.96, 1.0), rim * u_rim);
    fragColor = vec4(outColor.rgb, coverage);
  } else {
    vec2 shadowPoint = gl_FragCoord.xy - vec2(u_shadowPosition.x, u_shadowPosition.y) * u_dpr;
    float shadowDist = mainSDF(p1, p2, shadowPoint);
    float shadow = exp(-1.0 / u_shadowExpand * abs(shadowDist) * u_resolution1x.y) * 0.6 * u_shadowFactor;
    float outside = smoothstep(0.0, 1.5 / u_resolution1x.y, merged);
    fragColor = vec4(0.0, 0.0, 0.0, clamp(shadow, 0.0, 1.0) * outside);
  }
}
`;
