"use client";

import { useEffect, useState, type RefObject } from "react";
import { HelpCircle } from "lucide-react";
import { StudioCompass } from "@/components/studio/StudioCompass";
import type { CameraState } from "@/components/studio/CameraController";

const FIRST_VISIT_HINT_MS = 3500;

interface StudioHUDProps {
  totalRooms: number;
  onToggleMenu: () => void;
  menuOpen: boolean;
  cameraStateRef: RefObject<CameraState>;
  /** Re-opens the guided tour. It runs itself once per visitor; this is how
   * anyone gets it back afterwards. */
  onReplayTour: () => void;
}

// Deliberately minimal beyond the compass + mode badge + hamburger — the
// room's own identity now lives in StudioRoomPanel (richer than the old
// bottom-left room-code text this replaced), the site-wide KOV mark/
// search/nav links come from the real <Nav/> (rendered by
// StudioExperience.tsx, not this component), and "Drag 360°" is
// superseded by StudioRoomPanel's own interaction-hints list. This just
// owns: the live compass, the hamburger toggle for GlobalOverviewMenu (a
// distinct "whole-site overview" experience, not what Nav's own mobile
// menu does) + the first-visit drag hint.
export function StudioHUD({
  totalRooms,
  onToggleMenu,
  menuOpen,
  cameraStateRef,
  onReplayTour,
}: StudioHUDProps) {
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
        <StudioCompass stateRef={cameraStateRef} />
        {/* Hidden below md. The top row is one flex line — compass, badge,
            hand, help, Menu — and this badge carries whitespace-nowrap, so it
            could not shrink: the row measured ~420px on a 390px phone and
            pushed itself left, under the nav pill. It is the one item in that
            row that is decorative rather than a control. */}
        <div
          className="pointer-events-auto hidden md:flex items-center gap-2 px-3 py-1.5"
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
          onClick={onReplayTour}
          aria-label="Revoir la visite guidée"
          className="pointer-events-auto flex items-center justify-center w-8 h-8 text-kov-bone hover:text-kov-red transition-colors"
          style={{
            borderRadius: "var(--radius-pill)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <HelpCircle size={14} />
        </button>
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
