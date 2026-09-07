"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { TagPill } from "@/components/ui/Chip";

interface ActivationCardProps {
  tag: string;
  title: string;
  body: string;
  features: string[];
  icon: ReactNode;
  chart: ReactNode;
  media: ReactNode;
  index: number;
  reducedMotion: boolean;
}

// A wide "feature row" card — image/video panel on one side, content on
// the other (stacked on mobile) — in a vertical list of these (see
// ActivationWindow), rather than the previous compact 9:16 cards side by
// side. Still measures its own rendered pixel size (ResizeObserver, same
// pattern as ActivationSlider's track) so GlassSurface gets an explicit
// width/height instead of a percentage.
export function ActivationCard({ tag, title, body, features, icon, chart, media, index, reducedMotion }: ActivationCardProps) {
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
      initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: reducedMotion ? 0 : 0.1 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full overflow-hidden shrink-0"
      style={{ minHeight: 360, borderRadius: 20 }}
    >
      {size.width > 0 && (
        <GlassSurface width={size.width} height={size.height} borderRadius={20} style={{ position: "absolute", inset: 0 }} />
      )}
      <div className="relative h-full flex flex-col md:flex-row">
        <div className="relative w-full md:w-[38%] shrink-0 aspect-video md:aspect-auto overflow-hidden">{media}</div>

        <div className="flex-1 flex flex-col justify-center p-6 md:p-8 text-left min-w-0">
          <div className="flex items-start justify-between gap-4 mb-4">
            <TagPill>{tag}</TagPill>
            <div aria-hidden="true" className="shrink-0" style={{ transform: "scale(0.6)", transformOrigin: "top right" }}>
              {chart}
            </div>
          </div>

          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--kov-red)" strokeWidth="1.6" className="mb-3">
            {icon}
          </svg>
          <p className="text-kov-bone text-base uppercase tracking-wide mb-2">{title}</p>
          <p className="text-kov-steel text-sm leading-relaxed mb-4">{body}</p>

          <ul className="space-y-1.5 pt-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-xs text-kov-concrete">
                <span aria-hidden="true" className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--kov-red)" }} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
