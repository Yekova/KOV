import type { ReactNode } from "react";
import type { PILLARS } from "@/data/expertisePillars";

type Pillar = (typeof PILLARS)[number];

interface ExpertiseCardProps {
  pillar: Pillar;
  visual: ReactNode;
  active: boolean;
  /** Drives padding/text scale — the Intégration bar and the Design hero
   * don't share the same typography treatment as the smaller tiles. */
  size: "sm" | "md" | "lg" | "wide";
}

const TITLE_SIZE: Record<ExpertiseCardProps["size"], string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  wide: "text-lg",
};

// Flat glass background (no GlassSurface — a performance-driven choice:
// several of these are visible/animating in at once). `active` swaps in a
// red-tinted border/glow and a small scale boost via a plain CSS
// transition — a discrete on/off the parent flips per scroll frame's
// rounded active index, not something scrubbed continuously per pixel.
export function ExpertiseCard({ pillar, visual, active, size }: ExpertiseCardProps) {
  const showBody = size !== "sm";

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col"
      style={{
        borderRadius: 16,
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: active ? "1px solid var(--kov-red)" : "1px solid var(--glass-border)",
        boxShadow: active ? "0 0 32px rgba(227,30,36,0.35), var(--glass-shadow-full)" : "var(--glass-shadow-full)",
        transform: active ? "scale(1.03)" : "scale(1)",
        transition: "transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease",
      }}
    >
      <div className="relative flex-1 min-h-0 overflow-hidden">{visual}</div>

      <div className={size === "wide" ? "px-5 py-4 shrink-0 flex items-center gap-4" : "p-5 shrink-0"}>
        <p className="text-kov-red font-mono text-xs shrink-0">{pillar.number}</p>
        <div className={size === "wide" ? "min-w-0" : "mt-2"}>
          <p className={`font-display text-kov-bone uppercase ${TITLE_SIZE[size]}`}>{pillar.title}</p>
          <p className="text-kov-steel text-xs uppercase tracking-wide mt-1">{pillar.tagline}</p>
          {showBody && size !== "wide" && <p className="text-kov-concrete text-xs leading-relaxed mt-3 line-clamp-3">{pillar.body}</p>}
        </div>
      </div>
    </div>
  );
}
