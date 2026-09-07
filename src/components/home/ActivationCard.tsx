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
  index: number;
  reducedMotion: boolean;
  /** True once this card's scroll-scrubbed reveal has actually started —
   * gates mounting `chart` so its own entrance animation plays in sync
   * with the card becoming visible, instead of finishing invisibly before
   * the card ever fades in. Always true under reducedMotion (no scroll
   * scrub there, cards just appear). */
  revealed: boolean;
  /** Forwards the card's root DOM node to ActivationWindow's scroll
   * effect, which drives opacity/position via gsap.set — see the split
   * between reducedMotion (framer owns the mount transition) and normal
   * motion (framer is inert, external imperative styles own it) below. */
  onElementRef?: (el: HTMLDivElement | null) => void;
}

// 9:16 portrait card — measures its own rendered pixel size (ResizeObserver,
// same pattern as ActivationSlider's track) so GlassSurface gets an
// explicit width/height instead of a percentage: this is a CSS Grid cell
// with a definite computed size, not the auto-sized/ambiguous case
// GlassSurface's own docs warn about, but staying with the
// already-proven-safe explicit-pixel pattern removes any doubt.
export function ActivationCard({
  tag,
  title,
  body,
  features,
  icon,
  chart,
  index,
  reducedMotion,
  revealed,
  onElementRef,
}: ActivationCardProps) {
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
      ref={(el) => {
        wrapperRef.current = el;
        onElementRef?.(el);
      }}
      // reducedMotion: framer owns a simple mount fade-in (no scroll scrub
      // happens at all in that mode). Otherwise: framer is inert
      // (initial=false, no animate) and the plain `style.opacity`/`y`
      // below is what ActivationWindow's scroll effect overrides via
      // gsap.set — two systems fighting the same properties would jank.
      initial={reducedMotion ? { opacity: 0, y: 16 } : false}
      animate={reducedMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, delay: reducedMotion ? 0 : 0.15 + index * 0.08 }}
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: "9 / 16", borderRadius: 18, opacity: reducedMotion ? undefined : 0 }}
    >
      {size.width > 0 && (
        <GlassSurface width={size.width} height={size.height} borderRadius={18} style={{ position: "absolute", inset: 0 }} />
      )}
      <div className="relative h-full flex flex-col p-5">
        <TagPill>{tag}</TagPill>

        <div className="flex-1 flex items-center justify-center py-4">
          {revealed && chart}
        </div>

        <div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--kov-red)" strokeWidth="1.6" className="mb-3">
            {icon}
          </svg>
          <p className="text-kov-bone text-sm uppercase tracking-wide mb-1">{title}</p>
          <p className="text-kov-steel text-xs leading-relaxed mb-4">{body}</p>

          <ul className="space-y-1.5 pt-3" style={{ borderTop: "1px solid var(--glass-border)" }}>
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-[11px] text-kov-concrete">
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
