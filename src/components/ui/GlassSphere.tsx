interface GlassSphereProps {
  size?: number;
  className?: string;
}

// Purely decorative "liquid glass" bubble/sphere motif — see the 2026-08-18
// design token sheet. aria-hidden: never carries content or meaning.
export function GlassSphere({ size = 160, className = "" }: GlassSphereProps) {
  return (
    <div
      aria-hidden
      className={`rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.16), rgba(255,255,255,0.02) 55%, transparent 72%)",
        border: "1px solid var(--glass-border)",
      }}
    />
  );
}
