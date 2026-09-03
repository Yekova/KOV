"use client";

import { useRef, useState } from "react";
import { useScrolled } from "@/hooks/useScrolled";
import { useOnLightZone } from "@/hooks/useOnLightZone";
import { GlassSurface } from "@/components/ui/GlassSurface";

const BUTTON_SIZE = 44; // matches w-11/h-11 (Tailwind's 11 * 4px)

const DOT_POSITIONS = [4, 12, 20];

interface GlobalMenuButtonProps {
  open: boolean;
  onToggle: () => void;
  /** "contained": positioned absolute within a positioned ancestor (used by
   * HeroScene, nested inside its own frame) instead of fixed to the
   * viewport — same offsets from its container's edge either way. */
  variant?: "fixed" | "contained";
}

// Fixed bottom-center glass pill, icon-only — a 3x3 grid of dots ("bento" /
// app-launcher glyph) that opens GlobalOverviewMenu. Same glass-pill token
// recipe Nav.tsx uses, duplicated here since no shared constant exists for
// it anywhere in the codebase yet (NavDropdownPanel and MobileNavMenu each
// duplicate their own glass style block too).
export function GlobalMenuButton({ open, onToggle, variant = "fixed" }: GlobalMenuButtonProps) {
  const [hovered, setHovered] = useState(false);
  // Same reasoning as Nav.tsx: "contained" would otherwise scroll away with
  // HeroScene after the first ~40px of scroll, since absolute positioning
  // ties it to the section's own box, not the viewport.
  const scrolled = useScrolled();
  const isFixed = variant === "fixed" || scrolled;
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Same light-zone detection as Nav.tsx — this button is bottom-anchored
  // rather than top, so it checks its own position against the registry
  // independently rather than sharing Nav's result.
  const onLight = useOnLightZone(wrapperRef);

  return (
    <div
      ref={wrapperRef}
      className={`${isFixed ? "fixed" : "absolute"} bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2`}
      style={{
        zIndex: "var(--z-nav)",
        ...(onLight ? ({ "--kov-bone": "var(--kov-black)" } as React.CSSProperties) : undefined),
      }}
    >
      <span
        className="text-[10px] uppercase tracking-widest text-kov-bone transition-[opacity,color] duration-300"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        Menu
      </span>
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={open ? "Fermer l'aperçu du site" : "Voir tout le site"}
        className="text-kov-bone hover:text-kov-red transition-transform duration-300"
        style={{ transform: hovered ? "scale(1.08)" : "scale(1)" }}
      >
        {/* Explicit pixel size (not "100%") — this button is a fixed
            44x44px shape (w-11/h-11), so there's no auto-sized-container
            ambiguity here the way there was on Nav's pill, but staying
            explicit everywhere avoids relying on that distinction being
            remembered correctly next time this is touched. */}
        <GlassSurface
          width={BUTTON_SIZE}
          height={BUTTON_SIZE}
          borderRadius={999}
          style={{
            boxShadow: hovered ? "0 0 24px rgba(227, 30, 36, 0.45), var(--glass-shadow-full)" : undefined,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{
              transform: hovered ? "rotate(12deg)" : "rotate(0deg)",
              transition: "transform 0.4s ease",
            }}
          >
            {DOT_POSITIONS.flatMap((cy) =>
              DOT_POSITIONS.map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" />)
            )}
          </svg>
        </GlassSurface>
      </button>
    </div>
  );
}
