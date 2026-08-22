"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const AUTO_REVEAL_DELAY_MS = 4000;

// Floating assistant in the sidebar's bottom corner — deliberately not a
// GlassCard (no border/background box): the "detached from the interface"
// feel comes from it being the one thing on the page that isn't a bordered
// panel. The bubble appears on hover or after a few seconds, whichever
// comes first, and stays as long as either condition holds.
//
// containerRef/portraitRef are split out (rather than one wrapping element)
// specifically so a future mouse-tracking effect can apply a transform
// directly to the portrait image — relative to containerRef's bounding box —
// without restructuring this component. Nothing here currently reads or
// writes a transform on either ref; they're just the seam for that later.
export function KovAssistant() {
  const containerRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);
  const [autoRevealed, setAutoRevealed] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAutoRevealed(true), AUTO_REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const bubbleVisible = autoRevealed || hovering;

  return (
    <div
      ref={containerRef}
      className="relative flex justify-center pt-4"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Link href="/client/support" className="relative block" aria-label="Besoin d'aide ? Contacter KOV">
        <div
          className="absolute left-1/2 top-0 px-4 py-2 whitespace-nowrap border transition-all"
          style={{
            transform: `translate(-50%, ${bubbleVisible ? "-100%" : "-85%"})`,
            opacity: bubbleVisible ? 1 : 0,
            transitionDuration: "500ms",
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            borderColor: "var(--glass-border)",
            borderRadius: "var(--radius-pill)",
            boxShadow: "var(--glass-shadow-full)",
            pointerEvents: "none",
          }}
        >
          <span className="text-kov-bone text-xs uppercase tracking-widest">Besoin d&apos;aide ?</span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={portraitRef}
          src="/kov/character/assistant-portrait-transparent.png"
          alt=""
          className="w-28 h-auto object-contain pointer-events-none select-none"
        />
      </Link>
    </div>
  );
}
