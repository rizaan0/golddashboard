"use client";

import type { ReactNode } from "react";

export function PageFade({ children }: { children: ReactNode }) {
  return <div className="page-arrive">{children}</div>;
}
