"use client";

import { useState } from "react";
import type { StudioNode } from "@/config/studio/studioNodes";

interface StudioRoomPanelProps {
  node: StudioNode;
  roomIndex: number;
  totalRooms: number;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  /** Real intro-video path once supplied — an honest disabled state
   * otherwise, same convention as ResponsiveMedia/PhotoPlaceholder. */
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

  return (
    <div
      className="absolute left-6 top-24 md:top-28 w-[300px] max-w-[85vw] p-6"
      style={{
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
