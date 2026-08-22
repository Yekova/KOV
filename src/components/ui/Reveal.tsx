"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { motion, LIQUID_EASE } from "@/lib/motion";

// Hand-rolled scroll reveal — no new dependency, matches this codebase's
// existing pattern (see KovCharacterScene/CustomCursor) of building
// interaction from raw browser APIs rather than a motion library.
// docs/KOV-MOTION.md: "motion = communication, never decoration" and
// "avoid: exaggerated spring, bounce" — this is a single, slow, linear
// fade + rise, nothing bouncier.
//
// `as` lets this render as something other than a <div> — e.g. "li" inside
// an <ol>, where a wrapping div would break list semantics.
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
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

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity ${motion.slow}s ${LIQUID_EASE} ${delay}s, transform ${motion.slow}s ${LIQUID_EASE} ${delay}s`,
      }}
    >
      {children}
    </Tag>
  );
}
