"use client";

import { useEffect, useState } from "react";

const FIRST_VISIT_HINT_MS = 3500;

interface StudioHUDProps {
  totalRooms: number;
  onToggleMenu: () => void;
  menuOpen: boolean;
}

// Deliberately minimal beyond the hamburger + mode badge — the room's own
// identity now lives in StudioRoomPanel (richer than the old bottom-left
// room-code text this replaced), the site-wide KOV mark/search/nav links
// come from the real <Nav/> (rendered by StudioExperience.tsx, not this
// component), and "Drag 360°" is superseded by StudioRoomPanel's own
// interaction-hints list. This just owns: the hamburger toggle for
// GlobalOverviewMenu (a distinct "whole-site overview" experience, not
// what Nav's own mobile menu does) + the first-visit drag hint.
export function StudioHUD({ totalRooms, onToggleMenu, menuOpen }: StudioHUDProps) {
  const [showHint, setShowHint] = useState(
    () => typeof window !== "undefined" && !sessionStorage.getItem("kov-studio-hint-seen")
  );

  useEffect(() => {
    if (!showHint) return;
    const timer = setTimeout(() => {
      setShowHint(false);
      sessionStorage.setItem("kov-studio-hint-seen", "1");
    }, FIRST_VISIT_HINT_MS);
    return () => clearTimeout(timer);
  }, [showHint]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: "var(--z-nav)" }}>
      <div className="flex items-start justify-end gap-3 p-6 md:p-8 pointer-events-none">
        <div
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5"
          style={{
            borderRadius: "var(--radius-pill)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--kov-red)" }} />
          <span className="text-kov-bone text-[10px] uppercase tracking-widest whitespace-nowrap">
            Mode exploration · {totalRooms} salles
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleMenu}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fermer le menu" : "Voir tout le site"}
          className="pointer-events-auto text-kov-bone hover:text-kov-red transition-colors text-xs uppercase tracking-widest flex items-center gap-2"
        >
          {menuOpen ? "× Fermer" : "Menu"}
        </button>
      </div>

      {showHint && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transition: "opacity 0.6s ease", opacity: showHint ? 1 : 0 }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 text-kov-bone" style={{ opacity: 0.85 }}>
              <span aria-hidden="true">←</span>
              <span className="text-[10px] uppercase tracking-widest">Drag to explore</span>
              <span aria-hidden="true">→</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
