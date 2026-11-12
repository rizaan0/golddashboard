/** Defaults from liquid-glass-studio `src/Controls.tsx`. These are the values in the Studio preview. */
export const studioGlass = {
  refThickness: 20,
  refDistance: 0.05,
  refFactor: 1.4,
  refDispersion: 7,
  refFresnelRange: 30,
  refFresnelHardness: 20,
  refFresnelFactor: 20,
  glareRange: 30,
  glareHardness: 20,
  glareFactor: 90,
  glareConvergence: 50,
  glareOppositeFactor: 80,
  glareAngle: -45,
  blurRadius: 1,
  blurEdge: true,
  tint: { r: 255, g: 255, b: 255, a: 0 },
  shadowExpand: 25,
  shadowFactor: 15,
  shadowPosition: { x: 0, y: -10 },
  shapeRadius: 80,
  shapeRoundness: 5,
  mergeRate: 0.05,
} as const;

/** Same conversion as the Studio: corner radius is a percentage of half the shorter side. */
export function studioCornerRadius(width: number, height: number) {
  return (Math.min(width, height) / 2) * (studioGlass.shapeRadius / 100);
}

export const GLASS_PAD = Math.ceil(
  studioGlass.shadowExpand +
    Math.max(Math.abs(studioGlass.shadowPosition.x), Math.abs(studioGlass.shadowPosition.y)) +
    24,
);
