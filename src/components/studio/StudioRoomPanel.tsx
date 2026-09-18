"use client";

import { useState } from "react";
import { X, Info } from "lucide-react";
import type { StudioNode } from "@/config/studio/studioNodes";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface StudioRoomPanelProps {
  node: StudioNode;
  roomIndex: number;
  totalRooms: number;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  /** Real intro-video path once supplied — an honest disabled state
   * otherwise, same convention used throughout the site for assets not
   * yet supplied. */
  videoSrc?: string;
}

const HINTS: { label: string; icon: React.ReactNode }[] = [
  {
    label: "Regarder autour de vous",
    icon: <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z" />,
  },
  {
    label: "Cliquer sur les points d'intérêt",
    icon: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></>,
  },
  {
    label: "Naviguer entre les salles",
    icon: <path d="M9 6l6 6-6 6" />,
  },
  {
    label: "Découvrir les points d'information",
    icon: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16.5" /><circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" /></>,
  },
];

// The board's left column: room N/total + prev/next, title/subtitle,
// description, a static interaction-hints checklist (same for every
// room — generic instructions, not room-specific content), and the
// intro-video trigger.
export function StudioRoomPanel({
  node,
  roomIndex,
  totalRooms,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  videoSrc,
}: StudioRoomPanelProps) {
  const [videoOpen, setVideoOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  // Dismissible, and closed by default on a phone. On a 390px screen this
  // panel covered about 60% of the viewport, over a 360° view that is the
  // entire reason for the page — the explanation was hiding the thing it
  // explains. On desktop it has room and stays open, as before.
  // null means "whatever this breakpoint's default is", so someone who has
  // not touched it gets the panel open when they rotate to landscape and
  // closed again when they rotate back. Once they choose, their choice wins.
  const [override, setOverride] = useState<boolean | null>(null);
  const open = override ?? !isMobile;

  if (!open) {
    return (
      <button
        type="button"
        data-tour="room-panel"
        onClick={() => setOverride(true)}
        aria-label={`Informations sur la salle ${node.name}`}
        className="absolute left-6 top-32 md:top-28 pointer-events-auto flex items-center gap-2 px-3 py-2 text-kov-bone"
        style={{
          borderRadius: "var(--radius-pill)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <Info size={13} aria-hidden="true" />
        <span className="font-mono text-[10px] tracking-widest">{node.room}</span>
        <span className="text-[10px] uppercase tracking-widest">{node.name}</span>
      </button>
    );
  }

  return (
    <div
      data-tour="room-panel"
      // top-32 below md, not top-24: under 430px the panel is wide enough to
      // reach the "Carte" button in the top-right corner, and the two
      // overlapped in a 14px band. Above md the map is a 280px panel on the
      // far right instead and there is no contact.
      className="absolute left-6 top-32 md:top-28 w-[300px] max-w-[85vw] p-6 overflow-y-auto overscroll-contain"
      style={{
        // The panel had no height bound and no awareness of what sits below
        // it. Measured: it runs ~430px from a top of 96/112px, and the room
        // carousel plus footer occupy ~195/211px up from the bottom — so the
        // two collided on any viewport shorter than ~750px. That is not an
        // edge case: it is every 1366×768 laptop once browser chrome is
        // subtracted, every landscape phone, and any half-height window.
        //
        // dvh rather than vh so a mobile browser's collapsing address bar
        // doesn't leave the panel running under the carousel it was sized
        // to clear.
        maxHeight: "calc(100dvh - 8rem - 13rem)",
        scrollbarWidth: "thin",
        borderRadius: 18,
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-xs text-kov-steel">
          {String(roomIndex + 1).padStart(2, "0")} / {String(totalRooms).padStart(2, "0")}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOverride(false)}
            aria-label="Masquer les informations de la salle"
            className="w-7 h-7 flex items-center justify-center text-kov-steel hover:text-kov-red transition-colors"
          >
            <X size={14} />
          </button>
          <span aria-hidden="true" className="w-px h-3.5" style={{ background: "var(--glass-border)" }} />
          <button
            type="button"
            onClick={onPrev}
            disabled={prevDisabled}
            aria-label="Salle précédente"
            className="w-7 h-7 flex items-center justify-center text-kov-bone disabled:opacity-30 hover:text-kov-red transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            aria-label="Salle suivante"
            className="w-7 h-7 flex items-center justify-center text-kov-bone disabled:opacity-30 hover:text-kov-red transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <h1 className="font-display text-kov-bone uppercase text-2xl">{node.name}</h1>
      <p className="text-kov-red text-[10px] uppercase tracking-widest mt-1">{node.subtitle}</p>

      <p className="mt-4 text-kov-steel text-sm leading-relaxed">{node.description}</p>

      <ul className="mt-6 space-y-2.5">
        {HINTS.map((hint) => (
          <li key={hint.label} className="flex items-center gap-3 text-xs text-kov-concrete">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--kov-steel)"
              strokeWidth="1.6"
              className="shrink-0"
              aria-hidden="true"
            >
              {hint.icon}
            </svg>
            {hint.label}
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--glass-border)" }}>
        {videoSrc ? (
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            className="w-full flex items-center gap-3 text-left text-kov-bone text-xs uppercase tracking-widest hover:text-kov-red transition-colors"
          >
            <span
              aria-hidden="true"
              className="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
              style={{ background: "var(--kov-red)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--kov-white)">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            Voir l&apos;introduction · 2 min
          </button>
        ) : (
          <p className="text-kov-steel text-[10px] uppercase tracking-widest">Vidéo d&apos;introduction · bientôt disponible</p>
        )}
      </div>

      {videoOpen && videoSrc && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ zIndex: "var(--z-modal)", background: "rgba(5,5,5,0.85)" }}
          onClick={() => setVideoOpen(false)}
        >
          <video
            src={videoSrc}
            controls
            autoPlay
            className="max-w-full max-h-full"
            style={{ borderRadius: 12 }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
