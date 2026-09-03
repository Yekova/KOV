"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StudioNode } from "@/config/studio/studioNodes";

const FIRST_VISIT_HINT_MS = 3500;

interface StudioHUDProps {
  node: StudioNode;
  onToggleMenu: () => void;
  menuOpen: boolean;
}

// Deliberately minimal — this replaces the sitewide floating nav pill for
// this one page (SiteChrome excludes /studio, same as /admin and /client),
// since the full toolbar would compete with the panorama itself (studio
// spec §19: "ne surcharge pas"). KOV mark + a single menu toggle is enough
// to get back to the rest of the site.
export function StudioHUD({ node, onToggleMenu, menuOpen }: StudioHUDProps) {
  // Lazy initializer reads sessionStorage directly for the first render —
  // avoids setting state synchronously inside an effect (same pattern as
  // Reveal.tsx/ContactWizard.tsx elsewhere in this codebase).
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
      <div className="flex items-start justify-between p-6 md:p-8 pointer-events-none">
        <Link href="/" className="pointer-events-auto font-display text-kov-bone text-sm tracking-widest">
          KOV
        </Link>
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

      <div className="absolute bottom-0 inset-x-0 flex items-end justify-between p-6 md:p-8 pointer-events-none">
        <div>
          <p className="text-kov-red text-[10px] uppercase tracking-widest font-mono">
            {node.room} / {node.name}
          </p>
        </div>
        <p className="text-kov-steel text-[10px] uppercase tracking-widest hidden sm:block">Drag 360°</p>
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
