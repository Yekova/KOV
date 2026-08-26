"use client";

import { useState } from "react";

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

  return (
    <div
      className={`${variant === "contained" ? "absolute" : "fixed"} bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2`}
      style={{ zIndex: "var(--z-nav)" }}
    >
      <span
        className="text-[10px] uppercase tracking-widest text-kov-bone transition-opacity duration-300"
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
        className="w-11 h-11 flex items-center justify-center border text-kov-bone hover:text-kov-red transition-all duration-300"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          borderColor: "var(--glass-border)",
          borderRadius: "var(--radius-pill)",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          boxShadow: hovered
            ? "0 0 24px rgba(227, 30, 36, 0.45), var(--glass-shadow-full)"
            : "var(--glass-shadow-full)",
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
      </button>
    </div>
  );
}
