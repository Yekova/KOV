"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { TagPill } from "@/components/ui/Chip";

interface ActivationCardProps {
  tag: string;
  title: string;
  body: string;
  features: string[];
  icon: ReactNode;
  chart: ReactNode;
  media: ReactNode;
  reducedMotion: boolean;
}

// A wide "feature row" card — image/video panel on one side, content on
// the other (stacked on mobile). Fills whatever box its caller gives it
// (ActivationWindow wraps each one in its own clip-path'd wipe layer) — so
// h-full, not a fixed/minimum height of its own.
// Flat glass background (background/blur/border, no SVG feDisplacementMap
// refraction) rather than GlassSurface — up to three of these mount at
// once (the base plus whichever cards are mid-wipe), and real-time
// backdrop refraction on that many simultaneous instances was the
// smoothness cost the user asked to cut; a flat panel behind a scroll-
// wiped card reads almost the same but costs nothing to render.
export function ActivationCard({ tag, title, body, features, icon, chart, media, reducedMotion }: ActivationCardProps) {
  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative w-full h-full overflow-hidden"
      style={{
        borderRadius: 20,
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
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
