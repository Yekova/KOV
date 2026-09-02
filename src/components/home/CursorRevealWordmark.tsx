"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const REVEAL_RADIUS = 220;
const WORDMARK_SIZE = "clamp(80px, 18vw, 280px)";

const baseTextStyle: CSSProperties = {
  fontSize: WORDMARK_SIZE,
  lineHeight: 1,
  margin: 0,
};

// Original interpretation of a described-but-not-provided React Bits Pro
// block ("cursor-reveal outlined wordmark") — no source was available to
// port, so this is a from-scratch build matching the description: an
// outlined (hollow) wordmark with a second, solid-red copy stacked on top,
// clipped to a circle that follows the cursor via a CSS radial-gradient
// mask. Two duplicate text nodes are aria-hidden; a single sr-only span
// carries the real accessible text.
export function CursorRevealWordmark({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const container = containerRef.current;
    const fill = fillRef.current;
    if (!container || !fill) return;

    let frame = 0;

    function handleMove(event: MouseEvent) {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = container!.getBoundingClientRect();
        fill!.style.setProperty("--reveal-x", `${event.clientX - rect.left}px`);
        fill!.style.setProperty("--reveal-y", `${event.clientY - rect.top}px`);
        fill!.style.opacity = "1";
      });
    }

    function handleLeave() {
      fill!.style.opacity = "0";
    }

    container.addEventListener("mousemove", handleMove);
    container.addEventListener("mouseleave", handleLeave);
    return () => {
      container.removeEventListener("mousemove", handleMove);
      container.removeEventListener("mouseleave", handleLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  return (
    <div ref={containerRef} className="relative inline-block select-none" style={{ isolation: "isolate" }}>
      <p
        aria-hidden="true"
        className="font-display uppercase"
        style={{ ...baseTextStyle, color: "transparent", WebkitTextStroke: "1.5px var(--kov-border)" }}
      >
        {text}
      </p>

      <div
        ref={fillRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: 0,
          maskImage: `radial-gradient(circle ${REVEAL_RADIUS}px at var(--reveal-x, 50%) var(--reveal-y, 50%), black 0%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle ${REVEAL_RADIUS}px at var(--reveal-x, 50%) var(--reveal-y, 50%), black 0%, transparent 100%)`,
        }}
      >
        <p className="font-display uppercase" style={{ ...baseTextStyle, color: "var(--kov-red)" }}>
          {text}
        </p>
      </div>

      <span className="sr-only">{text}</span>
    </div>
  );
}
