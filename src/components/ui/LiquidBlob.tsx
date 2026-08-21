"use client";

import { motion, LIQUID_EASE } from "@/lib/motion";
import type { LiquidRect } from "@/lib/useLiquidRect";

interface LiquidBlobProps {
  rect: LiquidRect | null;
  height: number;
  paddingX?: number;
}

// Two identical shapes chase the same target rect on different transition
// durations — the lead arrives first, the trail lags behind, and while
// they're apart a shared blur+contrast filter reads the gap between them as
// a stretching liquid connector. No spring/bounce (see docs/KOV-MOTION.md) —
// the "liquid" quality comes from that lead/trail lag, not from overshoot.
// Used by LiquidNavLinks (nav hover/active) and ContactWizard (step progress).
export function LiquidBlob({ rect, height, paddingX = 0 }: LiquidBlobProps) {
  if (!rect) return null;
  return (
    <div className="absolute inset-y-0 left-0 pointer-events-none" style={{ filter: "blur(6px) contrast(24)" }}>
      {[motion.fast, motion.normal].map((duration) => (
        <span
          key={duration}
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "var(--kov-red)",
            height,
            width: rect.width + paddingX * 2,
            transform: `translateX(${rect.left - paddingX}px)`,
            transitionProperty: "transform, width",
            transitionDuration: `${duration}s`,
            transitionTimingFunction: LIQUID_EASE,
          }}
        />
      ))}
    </div>
  );
}
