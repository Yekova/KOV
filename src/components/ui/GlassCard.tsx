"use client";

import { useRef, type MouseEvent as ReactMouseEvent, type MouseEventHandler, type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  /**
   * "solid" drops backdrop-filter in favor of a flat --kov-graphite fill,
   * same border/radius/shadow otherwise. Use for any panel that contains a
   * native <select> or <input type="date"> — backdrop-filter (like filter,
   * transform, will-change) on an ancestor breaks native popup hit-testing
   * in Chromium: the option list renders, but clicks land on whatever's
   * underneath instead of the option ("le curseur passe en dessous"). Not
   * a hypothetical — this shipped in QuickActionMenu's project/task forms.
   */
  variant?: "glass" | "solid";
  /**
   * Adds a soft red-tinted glow that follows the cursor on hover, adapted
   * from reactbits.dev's SpotlightCard (mouse position written straight to
   * a CSS custom property via ref, no re-render per mousemove — the
   * original's own approach, kept for the same perf reason). Opt-in, for
   * cards meant to feel directly interactive (project cards) — not a
   * default, per KOV-MOTION's rule against decorating every surface.
   */
  interactive?: boolean;
}

// Liquid Glass surface — see /docs/KOV-MOTION.md. A translucent light tint +
// blur/saturate + a bright top rim is what reads as glass on near-black;
// a flat dark overlay alone just looks like a darker box. Use for cards,
// project previews, spotlights — not as a background for ordinary text.
export function GlassCard({ children, className = "", onClick, variant = "glass", interactive = false }: GlassCardProps) {
  const spotlightRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(event: ReactMouseEvent<HTMLDivElement>) {
    if (!interactive || !spotlightRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    spotlightRef.current.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    spotlightRef.current.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      className={`border ${interactive ? "relative overflow-hidden group" : ""} ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      style={{
        background: variant === "solid" ? "var(--kov-graphite)" : "var(--glass-bg)",
        backdropFilter: variant === "solid" ? undefined : "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: variant === "solid" ? undefined : "blur(var(--glass-blur)) saturate(180%)",
        borderColor: "var(--glass-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
      {interactive && (
        <div
          ref={spotlightRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "radial-gradient(circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(227, 30, 36, 0.18), transparent 70%)",
          }}
        />
      )}
      {children}
    </div>
  );
}
