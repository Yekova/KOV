import type { MouseEventHandler, ReactNode } from "react";

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
}

// Liquid Glass surface — see /docs/KOV-MOTION.md. A translucent light tint +
// blur/saturate + a bright top rim is what reads as glass on near-black;
// a flat dark overlay alone just looks like a darker box. Use for cards,
// project previews, spotlights — not as a background for ordinary text.
export function GlassCard({ children, className = "", onClick, variant = "glass" }: GlassCardProps) {
  return (
    <div
      className={`border ${className}`}
      onClick={onClick}
      style={{
        background: variant === "solid" ? "var(--kov-graphite)" : "var(--glass-bg)",
        backdropFilter: variant === "solid" ? undefined : "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: variant === "solid" ? undefined : "blur(var(--glass-blur)) saturate(180%)",
        borderColor: "var(--glass-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
      {children}
    </div>
  );
}
