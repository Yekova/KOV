"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, initGsap } from "@/lib/motion";

interface GridParallaxBackdropProps {
  containerRef: RefObject<HTMLElement | null>;
}

// A faint architectural grid-line texture (`--kov-grid-line`) that drifts
// slowly via a GSAP-scrubbed parallax as the page scrolls — first built
// for the legal docs, reused here for any other long-form "reference"
// page (FAQ) that wants the same restrained textured backdrop instead of
// reinventing it. Caller owns the reduced-motion check (mounts/animates
// unconditionally whenever rendered) and passes the scrollable element
// the parallax should scrub against.
export function GridParallaxBackdrop({ containerRef }: GridParallaxBackdropProps) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const bg = bgRef.current;
    if (!container || !bg) return;
    initGsap();

    const ctx = gsap.context(() => {
      gsap.to(bg, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: container, start: "top top", end: "bottom bottom", scrub: true },
      });
    }, container);

    return () => ctx.revert();
  }, [containerRef]);

  return (
    <div
      ref={bgRef}
      aria-hidden="true"
      className="absolute -inset-x-0 -top-1/4 -bottom-1/4 pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(var(--kov-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--kov-grid-line) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 60% 50% at 50% 20%, black 0%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 20%, black 0%, transparent 70%)",
      }}
    />
  );
}
