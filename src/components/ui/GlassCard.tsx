import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

// Liquid Glass surface — see /docs/KOV-MOTION.md. Use for cards, project
// previews, spotlights — not as a background for ordinary text sections.
export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`backdrop-blur-[16px] border ${className}`}
      style={{
        background: "var(--glass-soft)",
        borderColor: "var(--glass-border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      {children}
    </div>
  );
}
