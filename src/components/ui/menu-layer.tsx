"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export function useAnchoredMenu(open: boolean, align: "start" | "end" = "start") {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 8;
    const width = Math.max(menu.offsetWidth, rect.width);
    const height = menu.offsetHeight;
    let left = align === "end" ? rect.right - width : rect.left;
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - 8 - width);
    if (left < 8) left = 8;
    let top = rect.bottom + gap;
    if (top + height > window.innerHeight - 8) {
      const above = rect.top - gap - height;
      top = above >= 8 ? above : Math.max(8, window.innerHeight - 8 - height);
    }
    setBox({ top, left, width });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const menu = menuRef.current;
    if (!menu) return;
    const observer = new ResizeObserver(place);
    observer.observe(menu);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  return { triggerRef, menuRef, box, place };
}

const GLASS_MENU_MS = 560;

export function useGlassPresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open || !mounted) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setMounted(false), reduce ? 0 : GLASS_MENU_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  return mounted;
}
