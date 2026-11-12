import { describe, expect, it } from "vitest";
import { rubberBand, springPresets, stepSpring } from "@/lib/motion/physics";

describe("rubberBand", () => {
  it("returns zero for zero distance and invalid dimensions", () => {
    expect(rubberBand({ distance: 0, dimension: 844 })).toBe(0);
    expect(rubberBand({ distance: 100, dimension: 0 })).toBe(0);
  });

  it("is monotonic and stays below the dimension", () => {
    const dimension = 844;
    const values = [0, 25, 100, 844, 3000].map((distance) =>
      rubberBand({ distance, dimension, coefficient: 0.55 }),
    );
    expect(values.every((value, index) => index === 0 || value >= values[index - 1])).toBe(true);
    expect(values.every((value) => value >= 0 && value < dimension)).toBe(true);
  });

  it("matches the reference pull curve approximately", () => {
    expect(rubberBand({ distance: 25, dimension: 844, coefficient: 0.55 })).toBeCloseTo(13.5, 1);
    expect(rubberBand({ distance: 100, dimension: 844, coefficient: 0.55 })).toBeCloseTo(51.6, 1);
  });
});

describe("stepSpring", () => {
  it("moves toward the target and settles at rest", () => {
    let x = 0;
    let v = 0;
    let settled = false;
    for (let i = 0; i < 600 && !settled; i++) {
      const result = stepSpring(x, v, 1, 1 / 60, springPresets.smooth);
      x = result.x;
      v = result.v;
      settled = result.settled;
    }
    expect(settled).toBe(true);
    expect(x).toBe(1);
    expect(v).toBe(0);
  });

  it("keeps velocity so a caller can retarget mid-flight", () => {
    const first = stepSpring(0, 0, 1, 1 / 60, springPresets.snappy);
    const reversed = stepSpring(first.x, first.v, 0, 1 / 60, springPresets.snappy);
    expect(first.v).not.toBe(0);
    expect(Number.isFinite(reversed.x)).toBe(true);
    expect(Number.isFinite(reversed.v)).toBe(true);
  });
});
