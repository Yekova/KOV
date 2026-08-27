"use client";

import { useRef, type ElementType, type MouseEvent as ReactMouseEvent, type MouseEventHandler, type ReactNode } from "react";

export type KovCardVariant = "primary" | "secondary" | "floating" | "glass" | "project" | "metric" | "process";

interface KovCardProps {
  children: ReactNode;
  variant?: KovCardVariant;
  /** Same cursor-tracked red-tinted spotlight as GlassCard's `interactive` — see there for why it's opt-in and ref-driven. */
  interactive?: boolean;
  as?: ElementType;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
}

// Seven surfaces, one component — see docs/KOV-MOTION.md's card system.
// Each variant is a different combination of the same tokens (fill, border,
// shadow weight, radius, padding), not seven unrelated looks:
//
// - glass     the base Liquid Glass recipe (identical to GlassCard) — the
//             default, for anything that just needs to read as "floating UI."
// - floating  glass + a heavier drop shadow, for a surface meant to read as
//             lifted further off the page (a card above other cards).
// - primary   solid --kov-graphite fill, no transparency — more visual
//             weight, for a single featured/emphasized card in a scene.
// - secondary transparent, border only — the lighter companion next to a
//             primary card, never competes with it for attention.
// - project   glass + generous padding + overflow-hidden, sized to host a
//             project visual (carousel slides, gallery cards).
// - metric    solid fill, tight padding, smaller radius — compact, reads
//             clearly at a glance for a single number/data point.
// - process   glass, tight padding, smaller radius — for process-step
//             detail that appears as a secondary floating card, not the
//             timeline row itself (ProcessTimeline stays plain text/markers).
//
// This doesn't replace GlassCard (still used across the site, untouched) —
// GlassCard's "glass"/"solid" split covers the cases already shipped;
// KovCard is the fuller system for the homepage motion/DA rebuild.
export function KovCard({ children, variant = "glass", interactive = false, as: Tag = "div", className = "", onClick }: KovCardProps) {
  const spotlightRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(event: ReactMouseEvent<HTMLElement>) {
    if (!interactive || !spotlightRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    spotlightRef.current.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    spotlightRef.current.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }

  const isSolid = variant === "primary" || variant === "metric";
  const isTransparent = variant === "secondary";
  const isCompact = variant === "metric" || variant === "process";
  const isProject = variant === "project";

  const background = isTransparent ? "transparent" : isSolid ? "var(--kov-graphite)" : "var(--glass-bg)";
  const backdropFilter = isTransparent || isSolid ? undefined : "blur(var(--glass-blur)) saturate(180%)";
  const borderColor = isTransparent ? "var(--kov-border)" : "var(--glass-border)";
  const borderRadius = isCompact ? "var(--radius-md)" : "var(--radius-glass)";
  const boxShadow =
    variant === "floating"
      ? "0 40px 90px rgba(0, 0, 0, 0.55), var(--glass-shadow-full)"
      : isTransparent
        ? "none"
        : "var(--glass-shadow-full)";
  const padding = isCompact ? "p-4" : isProject ? "p-8" : "p-6";

  return (
    <Tag
      className={`border ${padding} ${interactive ? "relative overflow-hidden group" : isProject ? "relative overflow-hidden" : ""} ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      style={{ background, backdropFilter, WebkitBackdropFilter: backdropFilter, borderColor, borderRadius, boxShadow }}
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
    </Tag>
  );
}
