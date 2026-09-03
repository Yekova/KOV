"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { gsap, initGsap } from "@/lib/motion";
import "./ScrollFloat.css";

interface ScrollFloatProps {
  children: string;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  containerClassName?: string;
  textClassName?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
}

// Vendored from React Bits (ScrollFloat, JS+CSS variant). Ported to
// TypeScript against this codebase's shared GSAP instance (@/lib/motion)
// instead of a fresh `gsap`/`ScrollTrigger` import, matching every other
// vendored motion piece here (DepthCarousel, LineWaves, ...). Dropped the
// demo's own font-size/weight opinions from the CSS — those are call-site
// decisions here, driven by KOV's own display type scale via
// containerClassName/textClassName, not a fixed 10rem default meant for a
// standalone demo page.
export function ScrollFloat({
  children,
  scrollContainerRef,
  containerClassName = "",
  textClassName = "",
  animationDuration = 1,
  ease = "back.inOut(2)",
  scrollStart = "center bottom+=50%",
  scrollEnd = "bottom bottom-=40%",
  stagger = 0.03,
}: ScrollFloatProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const chars = useMemo(
    () =>
      children.split("").map((char, index) => (
        <span className="char" key={index}>
          {char === " " ? " " : char}
        </span>
      )),
    [children]
  );

  useEffect(() => {
    if (reducedMotion) return;
    const el = containerRef.current;
    if (!el) return;
    initGsap();

    const scroller = scrollContainerRef?.current ?? window;
    const charElements = el.querySelectorAll(".char");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        charElements,
        { willChange: "opacity, transform", opacity: 0, yPercent: 120, scaleY: 2.3, scaleX: 0.7, transformOrigin: "50% 0%" },
        {
          duration: animationDuration,
          ease,
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          scaleX: 1,
          stagger,
          scrollTrigger: { trigger: el, scroller, start: scrollStart, end: scrollEnd, scrub: true },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [reducedMotion, scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger]);

  return (
    <h2 ref={containerRef} className={`scroll-float ${containerClassName}`}>
      <span className={`scroll-float-text ${textClassName}`}>{reducedMotion ? children : chars}</span>
    </h2>
  );
}

export default ScrollFloat;
