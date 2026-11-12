"use client";

import { useEffect, useRef } from "react";
import { captureRegion } from "@/components/liquid-glass/capture";
import { GLASS_PAD, studioCornerRadius, studioGlass } from "@/components/liquid-glass/preset";
import { createLiquidGlassRenderer } from "@/components/liquid-glass/renderer";

function hostCornerRadius(host: HTMLElement) {
  const radius = Number.parseFloat(getComputedStyle(host).borderTopLeftRadius);
  const box = host.getBoundingClientRect();
  const cap = Math.min(box.width, box.height) / 2;
  if (!Number.isFinite(radius)) return cap;
  return Math.min(radius, cap);
}

export function LiquidGlass({
  preserveShape = false,
  live = false,
  tint,
  rim = 0,
}: {
  preserveShape?: boolean;
  live?: boolean;
  tint?: { r: number; g: number; b: number; a: number };
  rim?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const reduced =
      window.matchMedia("(prefers-reduced-transparency: reduce)").matches ||
      window.matchMedia("(forced-colors: active)").matches;
    if (reduced) return;

    const renderer = createLiquidGlassRenderer(canvas);
    if (!renderer) return;
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
    let disposed = false;
    let ticket = 0;
    let timer = 0;
    let frame = 0;
    let sized = "";

    const update = async () => {
      const current = ++ticket;
      const screen = host.getBoundingClientRect();
      const layoutWidth = host.offsetWidth;
      const layoutHeight = host.offsetHeight;
      if (layoutWidth < 2 || layoutHeight < 2) return;
      const rect = new DOMRect(
        screen.x - GLASS_PAD,
        screen.y - GLASS_PAD,
        screen.width + GLASS_PAD * 2,
        screen.height + GLASS_PAD * 2,
      );
      canvas.style.width = `${layoutWidth + GLASS_PAD * 2}px`;
      canvas.style.height = `${layoutHeight + GLASS_PAD * 2}px`;
      const image = await captureRegion(rect);
      if (disposed || current !== ticket) return;
      const radius = preserveShape ? hostCornerRadius(host) : studioCornerRadius(layoutWidth, layoutHeight);
      const roundness = preserveShape ? 2 : studioGlass.shapeRoundness;
      if (!preserveShape) host.style.borderRadius = `${radius}px`;
      const key = [layoutWidth, layoutHeight, dpr, radius, roundness].join(":");
      if (key !== sized) {
        renderer.resize(layoutWidth + GLASS_PAD * 2, layoutHeight + GLASS_PAD * 2, dpr, layoutWidth, layoutHeight, radius, roundness);
        sized = key;
      }
      if (tint) renderer.setTint(tint.r / 255, tint.g / 255, tint.b / 255, tint.a);
      renderer.setRim(rim);
      renderer.setBackground(image, image.width / image.height);
      renderer.draw();
      canvas.dataset.glassReady = "true";
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void update();
      }, 80);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(host);
    host.addEventListener("animationend", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    const tick = () => {
      void update();
      if (!disposed) frame = window.requestAnimationFrame(tick);
    };
    if (live) frame = window.requestAnimationFrame(tick);
    else void update();

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("animationend", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      renderer.dispose();
    };
  }, [preserveShape, live, tint, rim]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute z-0"
      style={{ left: -GLASS_PAD, top: -GLASS_PAD }}
    />
  );
}
