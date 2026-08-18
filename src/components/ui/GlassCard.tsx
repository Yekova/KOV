import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

// Liquid Glass surface — see /docs/KOV-MOTION.md. A translucent light tint +
// blur/saturate + a bright top rim is what reads as glass on near-black;
// a flat dark overlay alone just looks like a darker box. Use for cards,
// project previews, spotlights — not as a background for ordinary text.
export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`border ${className}`}
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        borderColor: "var(--glass-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
      {children}
    </div>
  );
}
