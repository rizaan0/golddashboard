import { studioCornerRadius, studioGlass } from "@/components/liquid-glass/preset";
import { backgroundShader, horizontalBlurShader, mainShader, vertexShader, verticalBlurShader } from "@/components/liquid-glass/shaders";

const MAX_BLUR = 8;

function kernel(radius: number) {
  const safe = Math.max(1, Math.min(MAX_BLUR, Math.round(radius)));
  const sigma = safe / 3;
  const weights = new Float32Array(MAX_BLUR + 1);
  let sum = 0;
  for (let index = 0; index <= safe; index += 1) {
    const weight = Math.exp((-0.5 * index * index) / (sigma * sigma));
    weights[index] = weight;
    sum += index === 0 ? weight : weight * 2;
  }
  for (let index = 0; index <= safe; index += 1) weights[index] = (weights[index] ?? 0) / sum;
  return { radius: safe, weights };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string, name: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error(`Could not create ${name}`);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "empty log";
    gl.deleteShader(shader);
    throw new Error(`${name}: ${log}`);
  }
  return shader;
}

function program(gl: WebGL2RenderingContext, fragment: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexShader, "vertex");
  const frag = compile(gl, gl.FRAGMENT_SHADER, fragment, fragment.slice(0, 40).replace(/\s+/g, " "));
  const result = gl.createProgram();
  if (!result) throw new Error("Could not create a program");
  gl.attachShader(result, vertex);
  gl.attachShader(result, frag);
  gl.bindAttribLocation(result, 0, "a_position");
  gl.linkProgram(result);
  gl.deleteShader(vertex);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(result) ?? "Program link failed";
    gl.deleteProgram(result);
    throw new Error(log);
  }
  return result;
}

function target(gl: WebGL2RenderingContext, width: number, height: number) {
  const texture = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!texture || !fbo) throw new Error("Could not create a render target");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { texture, fbo };
}

function setNumber(gl: WebGL2RenderingContext, shader: WebGLProgram, name: string, value: number) {
  const location = gl.getUniformLocation(shader, name);
  if (location) gl.uniform1f(location, value);
}

function setInt(gl: WebGL2RenderingContext, shader: WebGLProgram, name: string, value: number) {
  const location = gl.getUniformLocation(shader, name);
  if (location) gl.uniform1i(location, value);
}

function setVec2(gl: WebGL2RenderingContext, shader: WebGLProgram, name: string, x: number, y: number) {
  const location = gl.getUniformLocation(shader, name);
  if (location) gl.uniform2f(location, x, y);
}

function setVec4(gl: WebGL2RenderingContext, shader: WebGLProgram, name: string, values: number[]) {
  const location = gl.getUniformLocation(shader, name);
  if (location) gl.uniform4f(location, values[0] ?? 0, values[1] ?? 0, values[2] ?? 0, values[3] ?? 0);
}

export function createLiquidGlassRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });
  if (!gl || gl.isContextLost()) return null;

  let bgProgram: WebGLProgram;
  let verticalProgram: WebGLProgram;
  let horizontalProgram: WebGLProgram;
  let glassProgram: WebGLProgram;
  try {
    bgProgram = program(gl, backgroundShader);
    verticalProgram = program(gl, verticalBlurShader);
    horizontalProgram = program(gl, horizontalBlurShader);
    glassProgram = program(gl, mainShader);
  } catch (error) {
    console.error(error);
    return null;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const pageTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pageTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([242, 242, 247, 255]));

  const passes = [bgProgram, verticalProgram, horizontalProgram, glassProgram];
  const blur = kernel(studioGlass.blurRadius);
  let width = 1;
  let height = 1;
  let dpr = 1;
  let shapeWidth = 1;
  let shapeHeight = 1;
  let corner = 14;
  let roundness: number = studioGlass.shapeRoundness;
  let pageRatio = 1;
  let pageReady = 0;
  let tint = [studioGlass.tint.r / 255, studioGlass.tint.g / 255, studioGlass.tint.b / 255, studioGlass.tint.a];
  let rim = 0;
  let bgTarget = target(gl, 1, 1);
  let verticalTarget = target(gl, 1, 1);
  let horizontalTarget = target(gl, 1, 1);
  let disposed = false;

  const shared = (shader: WebGLProgram) => {
    gl.useProgram(shader);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const centerX = (width / 2) * dpr;
    const centerY = (height / 2) * dpr;
    setVec2(gl, shader, "u_resolution", width * dpr, height * dpr);
    setNumber(gl, shader, "u_dpr", dpr);
    setVec2(gl, shader, "u_mouse", centerX, centerY);
    setVec2(gl, shader, "u_mouseSpring", centerX, centerY);
    setNumber(gl, shader, "u_mergeRate", studioGlass.mergeRate);
    setNumber(gl, shader, "u_shapeWidth", shapeWidth);
    setNumber(gl, shader, "u_shapeHeight", shapeHeight);
    setNumber(gl, shader, "u_shapeRadius", corner);
    setNumber(gl, shader, "u_shapeRoundness", roundness);
    setInt(gl, shader, "u_showShape1", 0);
    setNumber(gl, shader, "u_shadowExpand", studioGlass.shadowExpand);
    setNumber(gl, shader, "u_shadowFactor", studioGlass.shadowFactor / 100);
    setVec2(gl, shader, "u_shadowPosition", -studioGlass.shadowPosition.x, -studioGlass.shadowPosition.y);
  };

  return {
    resize(nextWidth: number, nextHeight: number, nextDpr: number, nextShapeWidth: number, nextShapeHeight: number, nextCorner: number, nextRoundness: number = studioGlass.shapeRoundness) {
      if (disposed) return;
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      dpr = nextDpr;
      shapeWidth = nextShapeWidth;
      shapeHeight = nextShapeHeight;
      corner = nextCorner;
      roundness = nextRoundness;
      const pixelsWide = Math.round(width * dpr);
      const pixelsHigh = Math.round(height * dpr);
      canvas.width = pixelsWide;
      canvas.height = pixelsHigh;
      gl.deleteTexture(bgTarget.texture);
      gl.deleteFramebuffer(bgTarget.fbo);
      gl.deleteTexture(verticalTarget.texture);
      gl.deleteFramebuffer(verticalTarget.fbo);
      gl.deleteTexture(horizontalTarget.texture);
      gl.deleteFramebuffer(horizontalTarget.fbo);
      bgTarget = target(gl, pixelsWide, pixelsHigh);
      verticalTarget = target(gl, pixelsWide, pixelsHigh);
      horizontalTarget = target(gl, pixelsWide, pixelsHigh);
    },
    setTint(red: number, green: number, blue: number, alpha: number) {
      tint = [red, green, blue, alpha];
    },
    setRim(strength: number) {
      rim = strength;
    },
    setBackground(image: HTMLCanvasElement, ratio: number) {
      if (disposed || !pageTexture) return;
      gl.bindTexture(gl.TEXTURE_2D, pageTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      pageRatio = ratio;
      pageReady = 1;
    },
    draw() {
      if (disposed || pageReady !== 1) return;
      const pixelsWide = canvas.width;
      const pixelsHigh = canvas.height;
      gl.viewport(0, 0, pixelsWide, pixelsHigh);
      gl.disable(gl.BLEND);

      gl.bindFramebuffer(gl.FRAMEBUFFER, bgTarget.fbo);
      shared(bgProgram);
      setNumber(gl, bgProgram, "u_time", 0);
      setInt(gl, bgProgram, "u_bgType", 0);
      setNumber(gl, bgProgram, "u_bgTextureRatio", pageRatio);
      setInt(gl, bgProgram, "u_bgTextureReady", pageReady);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pageTexture);
      setInt(gl, bgProgram, "u_bgTexture", 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, verticalTarget.fbo);
      shared(verticalProgram);
      setInt(gl, verticalProgram, "u_blurRadius", blur.radius);
      const verticalWeights = gl.getUniformLocation(verticalProgram, "u_blurWeights[0]");
      if (verticalWeights) gl.uniform1fv(verticalWeights, blur.weights);
      gl.bindTexture(gl.TEXTURE_2D, bgTarget.texture);
      setInt(gl, verticalProgram, "u_prevPassTexture", 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, horizontalTarget.fbo);
      shared(horizontalProgram);
      setInt(gl, horizontalProgram, "u_blurRadius", blur.radius);
      const horizontalWeights = gl.getUniformLocation(horizontalProgram, "u_blurWeights[0]");
      if (horizontalWeights) gl.uniform1fv(horizontalWeights, blur.weights);
      gl.bindTexture(gl.TEXTURE_2D, verticalTarget.texture);
      setInt(gl, horizontalProgram, "u_prevPassTexture", 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, pixelsWide, pixelsHigh);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      shared(glassProgram);
      setVec4(gl, glassProgram, "u_tint", tint);
      setNumber(gl, glassProgram, "u_rim", rim);
      setNumber(gl, glassProgram, "u_refThickness", studioGlass.refThickness);
      setNumber(gl, glassProgram, "u_refDistance", studioGlass.refDistance);
      setNumber(gl, glassProgram, "u_refFactor", studioGlass.refFactor);
      setNumber(gl, glassProgram, "u_refDispersion", studioGlass.refDispersion);
      setNumber(gl, glassProgram, "u_refFresnelRange", studioGlass.refFresnelRange);
      setNumber(gl, glassProgram, "u_refFresnelHardness", studioGlass.refFresnelHardness / 100);
      setNumber(gl, glassProgram, "u_refFresnelFactor", studioGlass.refFresnelFactor / 100);
      setNumber(gl, glassProgram, "u_glareRange", studioGlass.glareRange);
      setNumber(gl, glassProgram, "u_glareHardness", studioGlass.glareHardness / 100);
      setNumber(gl, glassProgram, "u_glareConvergence", studioGlass.glareConvergence / 100);
      setNumber(gl, glassProgram, "u_glareOppositeFactor", studioGlass.glareOppositeFactor / 100);
      setNumber(gl, glassProgram, "u_glareFactor", studioGlass.glareFactor / 100);
      setNumber(gl, glassProgram, "u_glareAngle", (studioGlass.glareAngle * Math.PI) / 180);
      setInt(gl, glassProgram, "u_blurEdge", studioGlass.blurEdge ? 1 : 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, horizontalTarget.texture);
      setInt(gl, glassProgram, "u_blurredBg", 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bgTarget.texture);
      setInt(gl, glassProgram, "u_bg", 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const item of [bgTarget, verticalTarget, horizontalTarget]) {
        gl.deleteTexture(item.texture);
        gl.deleteFramebuffer(item.fbo);
      }
      if (pageTexture) gl.deleteTexture(pageTexture);
      if (buffer) gl.deleteBuffer(buffer);
      for (const item of passes) gl.deleteProgram(item);
    },
  };
}
