"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { GlassSurface } from "@/components/ui/GlassSurface";

interface ActivationCardProps {
  title: string;
  body: string;
  icon: ReactNode;
  chart: ReactNode;
  index: number;
  reducedMotion: boolean;
}

// 9:16 portrait card — measures its own rendered pixel size (ResizeObserver,
// same pattern as ActivationSlider's track) so GlassSurface gets an
// explicit width/height instead of a percentage: this is a CSS Grid cell
// with a definite computed size, not the auto-sized/ambiguous case
// GlassSurface's own docs warn about, but staying with the
// already-proven-safe explicit-pixel pattern removes any doubt.
export function ActivationCard({ title, body, icon, chart, index, reducedMotion }: ActivationCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div
      ref={wrapperRef}
      initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reducedMotion ? 0 : 0.15 + index * 0.08 }}
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: "9 / 16", borderRadius: 18 }}
    >
      {size.width > 0 && (
        <GlassSurface width={size.width} height={size.height} borderRadius={18} style={{ position: "absolute", inset: 0 }} />
      )}
      <div className="relative h-full flex flex-col p-5">
        <div className="flex-1 flex items-center justify-center">{chart}</div>
        <div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--kov-red)" strokeWidth="1.6" className="mb-3">
            {icon}
          </svg>
          <p className="text-kov-bone text-sm uppercase tracking-wide mb-1">{title}</p>
          <p className="text-kov-steel text-xs leading-relaxed">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}
