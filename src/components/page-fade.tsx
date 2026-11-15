"use client";

import { useSyncExternalStore, ViewTransition, type ReactNode } from "react";

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.addEventListener("visibilitychange", onChange);
  media.addEventListener("change", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
    media.removeEventListener("change", onChange);
  };
}

function fadeEnabled() {
  return !document.hidden && typeof document.startViewTransition === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PageFade({ children }: { children: ReactNode }) {
  const enabled = useSyncExternalStore(subscribe, fadeEnabled, () => false);
  if (!enabled) return <div>{children}</div>;
  return (
    <ViewTransition name="records" enter="none" exit="page-fade" share="page-fade">
      <div>{children}</div>
    </ViewTransition>
  );
}
