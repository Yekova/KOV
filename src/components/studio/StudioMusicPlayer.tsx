"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { LOUNGE_TRACKS } from "@/data/loungeTracks";

// An AirPods case, not a generic music-note icon — the "put your AirPods
// in" framing the Lounge room asked for. A simple rounded-rect case with a
// hinge-line and a small LED dot, not a literal trademarked rendering.
function AirPodsIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="4" width="12" height="16" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 9.5h12" stroke="currentColor" strokeWidth="1.2" opacity={0.5} />
      <circle cx="12" cy="7" r="1" fill={open ? "var(--kov-red)" : "currentColor"} />
    </svg>
  );
}

// Room-scoped ambient player — only ever mounted while the visitor is in
// the Lounge (see StudioExperience.tsx), and unmounting it (leaving the
// room) stops playback via the cleanup effect below, so nothing keeps
// playing silently in the background once you've walked away. No
// autoplay: browsers block audio-with-sound before a real user gesture
// anyway, and a click-to-play control is the honest way to ask for one.
export function StudioMusicPlayer() {
  const [open, setOpen] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const hasTracks = LOUNGE_TRACKS.length > 0;
  const track = hasTracks ? LOUNGE_TRACKS[trackIndex] : null;

  // Read via a ref rather than a `useEffect` dependency below — the
  // track-change effect must only re-run on `trackIndex`, not every time
  // playback toggles (that would re-`.load()` the element and restart the
  // current track from 0 on a plain pause/resume).
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  // `.load()` before `.play()` on every track change — a plain <audio>'s
  // `src` attribute updating in the DOM doesn't reliably reload the
  // element's own media pipeline across browsers on its own.
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    if (isPlayingRef.current) audioRef.current.play().catch(() => setIsPlaying(false));
  }, [trackIndex]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    else audioRef.current.pause();
  }, [isPlaying]);

  function step(delta: number) {
    if (!hasTracks) return;
    setTrackIndex((i) => (i + delta + LOUNGE_TRACKS.length) % LOUNGE_TRACKS.length);
  }

  return (
    <div className="pointer-events-auto relative">
      {/* Always mounted while this component is (i.e. for as long as the
          visitor stays in the Lounge), independent of whether the popover
          below is open — closing the popover to keep browsing the room
          shouldn't cut the music. */}
      {track && <audio ref={audioRef} src={track.src} onEnded={() => step(1)} />}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer le lecteur" : "Ouvrir le lecteur de musique"}
        aria-expanded={open}
        className="flex items-center justify-center w-10 h-10 text-kov-bone hover:text-kov-red transition-colors"
        style={{
          borderRadius: "var(--radius-pill)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <AirPodsIcon open={isPlaying} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 p-4 w-56"
          style={{
            borderRadius: "var(--radius-md)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--glass-shadow-full)",
          }}
        >
          <p className="text-kov-steel text-[10px] uppercase tracking-widest mb-3">Ambiance du salon</p>

          {track ? (
            <>
              <p className="text-kov-bone text-sm truncate">{track.title}</p>
              <p className="text-kov-steel text-xs truncate">{track.artist}</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <button type="button" onClick={() => step(-1)} aria-label="Piste précédente" className="text-kov-steel hover:text-kov-bone transition-colors">
                  <SkipBack size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying((v) => !v)}
                  aria-label={isPlaying ? "Mettre en pause" : "Lecture"}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-kov-black"
                  style={{ background: "var(--kov-bone)" }}
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Piste suivante" className="text-kov-steel hover:text-kov-bone transition-colors">
                  <SkipForward size={16} />
                </button>
              </div>
            </>
          ) : (
            <p className="text-kov-steel text-xs leading-relaxed">Aucune piste pour l&apos;instant.</p>
          )}
        </div>
      )}
    </div>
  );
}
