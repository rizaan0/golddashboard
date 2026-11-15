"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface LoaderSkeletonProps extends Omit<React.ComponentPropsWithoutRef<"div">, "style"> {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  baseColor?: string;
  highlightColor?: string;
  duration?: number;
  style?: React.CSSProperties;
}

export function LoaderSkeleton({
  className,
  width = "100%",
  height = 20,
  borderRadius = 4,
  baseColor,
  highlightColor,
  duration = 1.5,
  style,
  ...props
}: LoaderSkeletonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn("relative overflow-hidden bg-[#e5e5ea]", className)}
      style={{
        width,
        height,
        borderRadius,
        ...(baseColor && { backgroundColor: baseColor }),
        ...style,
      }}
      {...props}
    >
      {reduceMotion ? null : (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent, ${highlightColor || "rgba(255, 255, 255, 0.9)"}, transparent)`,
          }}
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      )}
    </div>
  );
}

export default LoaderSkeleton;
