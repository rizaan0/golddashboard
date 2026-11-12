import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassButton({
  className,
  size = "pill",
  tint = "blue",
  type = "button",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "pill" | "key";
  tint?: "blue" | "neutral";
}) {
  return (
    <button type={type} className={cn("glass-btn", `glass-btn-${size}`, `glass-btn-${tint}`, className)} {...props}>
      {children}
    </button>
  );
}
