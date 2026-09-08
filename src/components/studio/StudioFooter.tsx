"use client";

import { useEffect, useState } from "react";

const CLOCK_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
});

function useParisClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(CLOCK_FORMATTER.format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  return time;
}

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return { isFullscreen, toggle };
}

// The board's own footer copy ("Un studio digital indépendant pour un
// monde plus créatif") — a live Paris clock (ticks client-side, avoided
// rendering a server-mismatched time by starting at null and filling in
// on mount) and a real Fullscreen API toggle, not a decorative icon.
export function StudioFooter() {
  const time = useParisClock();
  const { isFullscreen, toggle } = useFullscreen();

  return (
    <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <p className="font-display text-kov-bone text-xs tracking-widest">KOV</p>
        <span aria-hidden="true" className="w-px h-3" style={{ background: "var(--glass-border)" }} />
        <p className="text-kov-steel text-[10px] uppercase tracking-widest hidden md:block">
          Un studio digital indépendant pour un monde plus créatif
        </p>
      </div>

      <div className="flex items-center gap-4">
        <p className="text-kov-steel text-[10px] uppercase tracking-widest font-mono">{time ? `Paris · ${time}` : "Paris"}</p>
        <button
          type="button"
          onClick={toggle}
          aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          className="text-kov-bone hover:text-kov-red transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {isFullscreen ? (
              <path d="M9 4v4a1 1 0 01-1 1H4M20 9h-4a1 1 0 01-1-1V4M15 20v-4a1 1 0 011-1h4M4 15h4a1 1 0 011 1v4" />
            ) : (
              <path d="M4 9V5a1 1 0 011-1h4M20 9V5a1 1 0 00-1-1h-4M4 15v4a1 1 0 001 1h4M20 15v4a1 1 0 01-1 1h-4" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
