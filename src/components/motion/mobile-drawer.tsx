"use client";

import { useEffect, useRef } from "react";
import { rubberBand, springPresets, stepSpring } from "@/lib/motion/physics";
import { usePrefersReducedMotion } from "@/lib/motion/use-spring";

const WIDTH = 288;

type Motion = {
  x: number;
  v: number;
  target: number;
  dragging: boolean;
  captured: boolean;
  origin: number;
  startX: number;
  lastX: number;
  lastTime: number;
};

export function MobileDrawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const scrimRef = useRef<HTMLButtonElement>(null);
  const reduced = usePrefersReducedMotion();
  const motion = useRef<Motion>({
    x: -WIDTH,
    v: 0,
    target: -WIDTH,
    dragging: false,
    captured: false,
    origin: 0,
    startX: 0,
    lastX: 0,
    lastTime: 0,
  });
  const frame = useRef(0);

  const paint = () => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!panel || !scrim) return;
    const x = motion.current.x;
    panel.style.transform = `translate3d(${x}px, 0, 0)`;
    const visible = Math.min(1, Math.max(0, (x + WIDTH) / WIDTH));
    scrim.style.opacity = String(visible * 0.35);
    const interactive = visible > 0.02;
    scrim.style.pointerEvents = interactive ? "auto" : "none";
    panel.style.pointerEvents = interactive ? "auto" : "none";
  };

  const settle = () => {
    cancelAnimationFrame(frame.current);
    if (reduced) {
      motion.current.x = motion.current.target;
      motion.current.v = 0;
      paint();
      return;
    }
    let previous: number | null = null;
    const tick = (time: number) => {
      if (motion.current.dragging) return;
      const elapsed = previous === null ? 0 : (time - previous) / 1000;
      previous = time;
      const next = stepSpring(motion.current.x, motion.current.v, motion.current.target, elapsed, springPresets.smooth);
      motion.current.x = next.x;
      motion.current.v = next.v;
      paint();
      if (!next.settled) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    motion.current.target = open ? 0 : -WIDTH;
    if (!motion.current.dragging) settle();
    return () => cancelAnimationFrame(frame.current);
  }, [open, reduced]);

  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector("a, button");
    if (first instanceof HTMLElement) first.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.querySelector<HTMLElement>("[data-menu-button]")?.focus();
    };
  }, [open, onOpenChange]);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    motion.current.dragging = true;
    motion.current.captured = false;
    motion.current.origin = motion.current.x;
    motion.current.startX = event.clientX;
    motion.current.lastX = event.clientX;
    motion.current.lastTime = event.timeStamp;
    motion.current.v = 0;
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!motion.current.dragging) return;
    const dx = event.clientX - motion.current.startX;
    if (!motion.current.captured && Math.abs(dx) < 8) return;
    if (!motion.current.captured) {
      motion.current.captured = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const raw = motion.current.origin + dx;
    let x = raw;
    if (raw > 0) x = rubberBand({ distance: raw, dimension: WIDTH });
    else if (raw < -WIDTH) x = -WIDTH - rubberBand({ distance: -WIDTH - raw, dimension: WIDTH });
    const dt = Math.max(1, event.timeStamp - motion.current.lastTime);
    motion.current.v = ((event.clientX - motion.current.lastX) / dt) * 1000;
    motion.current.lastX = event.clientX;
    motion.current.lastTime = event.timeStamp;
    motion.current.x = x;
    paint();
  };

  const endDrag = () => {
    if (!motion.current.dragging) return;
    const moved = motion.current.captured;
    motion.current.dragging = false;
    motion.current.captured = false;
    if (!moved) return;
    const shouldClose = motion.current.x < -WIDTH * 0.35 || motion.current.v < -400;
    motion.current.target = shouldClose ? -WIDTH : 0;
    onOpenChange(!shouldClose);
    settle();
  };

  return (
    <div className="lg:hidden" inert={!open}>
      <button
        ref={scrimRef}
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 z-40 bg-black"
        style={{ opacity: 0, pointerEvents: "none" }}
        onClick={() => onOpenChange(false)}
      />
      <aside
        ref={panelRef}
        id="app-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="material-sidebar fixed inset-y-0 left-0 z-50 w-72 touch-pan-y border-r"
        style={{ transform: "translate3d(-288px, 0, 0)" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        {children}
      </aside>
    </div>
  );
}
