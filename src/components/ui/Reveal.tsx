"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { motion, LIQUID_EASE, REVEAL_EASE } from "@/lib/motion";

export type RevealVariant = "fade" | "blur" | "zoom";

// Hidden/visible transform+filter pairs per variant, plus which easing reads
// right for each — REVEAL_EASE (fast-out, gentle-settle) for the two variants
// that carry a filter (blur resolving into focus wants a bit of initial snap),
// LIQUID_EASE (symmetric) for the plain fade+rise, matching how those two
// curves are already split elsewhere in the codebase (nav unfurl vs. liquid
// blob). Kept to three variants, not a variant per section, so the page reads
// as one system with a bit of rhythm — not a different animation everywhere.
const VARIANTS: Record<RevealVariant, { hidden: CSSProperties; visible: CSSProperties; ease: string }> = {
  fade: {
    hidden: { opacity: 0, transform: "translateY(28px)" },
    visible: { opacity: 1, transform: "translateY(0)" },
    ease: LIQUID_EASE,
  },
  blur: {
    hidden: { opacity: 0, transform: "translateY(12px)", filter: "blur(16px)" },
    visible: { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" },
    ease: REVEAL_EASE,
  },
  zoom: {
    hidden: { opacity: 0, transform: "scale(0.94)" },
    visible: { opacity: 1, transform: "scale(1)" },
    ease: REVEAL_EASE,
  },
};

// Hand-rolled scroll reveal — no new dependency, matches this codebase's
// existing pattern (see KovCharacterScene/CustomCursor) of building
// interaction from raw browser APIs rather than a motion library.
// docs/KOV-MOTION.md: "motion = communication, never decoration" and
// "avoid: exaggerated spring, bounce" — every variant here is a single,
// slow settle, nothing bouncier.
//
// `as` lets this render as something other than a <div> — e.g. "li" inside
// an <ol>, where a wrapping div would break list semantics.
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  style,
  variant = "fade",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
  variant?: RevealVariant;
}) {
  const ref = useRef<HTMLElement>(null);
  // Lazy initializer runs once at mount, during render — unlike setting this
  // from inside the effect below, it isn't flagged as a synchronous
  // setState-in-effect (which triggers an extra render pass for no reason
  // here, since the value is already knowable before first paint).
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (visible) return; // reduced motion — already visible from initial state, no observer needed
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  const { hidden, visible: visibleStyle, ease } = VARIANTS[variant];
  const state = visible ? visibleStyle : hidden;
  const transition = Object.keys(state)
    .map((property) => `${property} ${motion.slow}s ${ease} ${delay}s`)
    .join(", ");

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ ...style, ...state, transition }}
    >
      {children}
    </Tag>
  );
}
