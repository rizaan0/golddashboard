/**
 * Rubber-band edge curve and spring integration from the Apple UI pack.
 * rubberBand is the edge displacement curve only. It is not a browser scroll engine.
 */

export type RubberBandOptions = {
  distance: number;
  dimension: number;
  coefficient?: number;
};

export function rubberBand({
  distance,
  dimension,
  coefficient = 0.55,
}: RubberBandOptions): number {
  if (!Number.isFinite(distance) || !Number.isFinite(dimension) || !Number.isFinite(coefficient)) return 0;
  if (distance <= 0 || dimension <= 0 || coefficient <= 0) return 0;
  const scaled = (coefficient * distance) / dimension;
  return dimension * (1 - 1 / (1 + scaled));
}

export type SpringConfig = {
  mass: number;
  stiffness: number;
  damping: number;
  positionEpsilon?: number;
  velocityEpsilon?: number;
  maxStepSeconds?: number;
};

export const springPresets = {
  smooth: { mass: 1, stiffness: 157.91, damping: 25.13 },
  snappy: { mass: 1, stiffness: 157.91, damping: 21.36 },
  bouncy: { mass: 1, stiffness: 157.91, damping: 17.59 },
} satisfies Record<string, SpringConfig>;

export function stepSpring(
  x: number,
  v: number,
  target: number,
  elapsedSeconds: number,
  config: SpringConfig,
): { x: number; v: number; settled: boolean } {
  const mass = Math.max(config.mass, 1e-6);
  const stiffness = Math.max(config.stiffness, 0);
  const damping = Math.max(config.damping, 0);
  const maxStep = Math.min(Math.max(config.maxStepSeconds ?? 1 / 120, 1 / 1000), 1 / 30);
  const total = Math.max(0, Math.min(elapsedSeconds, 0.1));
  const steps = Math.max(1, Math.ceil(total / maxStep));
  const dt = total / steps;

  let position = x;
  let velocity = v;
  for (let i = 0; i < steps; i++) {
    const acceleration = (-stiffness * (position - target) - damping * velocity) / mass;
    velocity += acceleration * dt;
    position += velocity * dt;
  }

  const positionEpsilon = config.positionEpsilon ?? 0.001;
  const velocityEpsilon = config.velocityEpsilon ?? 0.01;
  const settled = Math.abs(position - target) <= positionEpsilon && Math.abs(velocity) <= velocityEpsilon;
  if (settled) return { x: target, v: 0, settled: true };
  return { x: position, v: velocity, settled: false };
}
