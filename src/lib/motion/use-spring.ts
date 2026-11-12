"use client";

import { useEffect, useRef, useState } from "react";
import { springPresets, stepSpring, type SpringConfig } from "@/lib/motion/physics";

type PresetName = keyof typeof springPresets;

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export function useSpringValue(target: number, preset: PresetName | SpringConfig = "smooth"): number {
  const config: SpringConfig = typeof preset === "string" ? springPresets[preset] : preset;
  const [value, setValue] = useState(target);
  const positionRef = useRef(target);
  const velocityRef = useRef(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      positionRef.current = target;
      velocityRef.current = 0;
      setValue(target);
      return;
    }

    let raf = 0;
    let previousTime: number | null = null;
    let active = true;

    const tick = (time: number) => {
      if (!active) return;
      const elapsed = previousTime === null ? 0 : (time - previousTime) / 1000;
      previousTime = time;
      const result = stepSpring(positionRef.current, velocityRef.current, target, elapsed, config);
      positionRef.current = result.x;
      velocityRef.current = result.v;
      setValue(result.x);
      if (!result.settled) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [
    target,
    reducedMotion,
    config.mass,
    config.stiffness,
    config.damping,
    config.positionEpsilon,
    config.velocityEpsilon,
    config.maxStepSeconds,
  ]);

  return value;
}
