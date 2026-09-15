"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, ChevronUp, ChevronDown } from "lucide-react";
import { LOUNGE_TRACKS } from "@/data/loungeTracks";
import { diag } from "@/lib/studioDiagnostics";

type ScreenMode = "now-playing" | "list";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// A literal MP3-player device — black body, recessed screen, circular
// click-wheel — modeled directly on the reference photo the user
// supplied ("MP3 STUDIO.png"), not a generic music-widget skin. Lives
// bottom-right on its own (the Lounge's own control, distinct from
// StudioHUD's top-right row), and only ever mounted while the visitor
// is in the Lounge (see StudioExperience.tsx) — leaving the room
// unmounts it, stopping playback via the cleanup effect below.
export function StudioMusicPlayer() {
  const [open, setOpen] = useState(false);
  // The <audio> element is not created on arrival — only once the visitor
  // has actually opened the player at least once, and it stays mounted
  // afterwards so hiding the device doesn't stop the music.
  //
  // Entering the Lounge is the one navigation in the Studio that also
  // spins up a media element, and it did so in the very same commit that
  // decodes and uploads a multi-megapixel panorama to the GPU. The
  // Rooftop, whose panorama is twice the weight, has never crashed — so
  // whatever is wrong is on this side, and the collapsed player has no
  // business touching the media pipeline at all: it's a button.
  const [audioArmed, setAudioArmed] = useState(false);
  const [mode, setMode] = useState<ScreenMode>("now-playing");
  const [trackIndex, setTrackIndex] = useState(0);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const audioRef = useRef<HTMLAudioElement>(null);

  const hasTracks = LOUNGE_TRACKS.length > 0;
  const track = hasTracks ? LOUNGE_TRACKS[trackIndex] : null;

  // Read via a ref rather than a `useEffect` dependency below — the
  // track-change effect must only re-run on `trackIndex`, not every time
  // playback toggles (that would re-`.load()` the element and restart
  // the current track from 0 on a plain pause/resume).
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    diag("music:mounted");
    return () => {
      audio?.pause();
      diag("music:unmounted");
    };
  }, []);

  // `.load()` before `.play()` on every track change — a plain <audio>'s
  // `src` attribute updating in the DOM doesn't reliably reload the
  // element's own media pipeline across browsers on its own. On the
  // Lounge's first render there is no element yet (see `audioArmed`), so
  // this simply no-ops until the visitor opens the player.
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    setProgress({ current: 0, duration: 0 });
    if (isPlayingRef.current) audioRef.current.play().catch(() => setIsPlaying(false));
  }, [trackIndex]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    else audioRef.current.pause();
  }, [isPlaying]);

  function selectTrack(index: number, autoplay = true) {
    setTrackIndex(index);
    setCursorIndex(index);
    setMode("now-playing");
    if (autoplay) setIsPlaying(true);
  }

  function step(delta: number) {
    if (!hasTracks) return;
    const next = (trackIndex + delta + LOUNGE_TRACKS.length) % LOUNGE_TRACKS.length;
    selectTrack(next, isPlaying);
  }

  // Up/down on the wheel first opens the track list (cursor starting on
  // whatever is currently playing), then walks the highlighted row —
  // separate from `trackIndex`, which only changes once a row is
  // actually selected (classic click-wheel menu behavior).
  function moveCursor(delta: number) {
    if (!hasTracks) return;
    if (mode === "now-playing") {
      setMode("list");
      setCursorIndex(trackIndex);
      return;
    }
    setCursorIndex((i) => (i + delta + LOUNGE_TRACKS.length) % LOUNGE_TRACKS.length);
  }

  function pressCenter() {
    if (!hasTracks) return;
    if (mode === "list") selectTrack(cursorIndex, true);
    else setIsPlaying((v) => !v);
  }

  return (
    <div className="fixed bottom-56 right-6" style={{ zIndex: "var(--z-nav)" }}>
      {audioArmed && track && (
        <audio
          ref={audioRef}
          src={track.src}
          // Nothing is fetched or handed to the browser's media pipeline
          // until the visitor actually presses play. Walking into the
          // Lounge used to start pulling a ~4MB track (and spinning up a
          // decoder) at the exact moment the room's panorama was being
          // decoded and uploaded to the GPU — work nobody asked for, in
          // the worst possible millisecond.
          preload="none"
          onEnded={() => step(1)}
          onError={() => diag("music:error", track.src)}
          onTimeUpdate={(e) => setProgress((p) => ({ ...p, current: e.currentTarget.currentTime }))}
          onLoadedMetadata={(e) => setProgress((p) => ({ ...p, duration: e.currentTarget.duration }))}
        />
      )}

      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setAudioArmed(true);
            diag("music:armed");
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-kov-bone hover:text-kov-red transition-colors"
          style={{
            borderRadius: "var(--radius-pill)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--glass-shadow-full)",
          }}
        >
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isPlaying ? "var(--kov-red)" : "var(--kov-steel)" }}
          />
          <span className="text-[10px] uppercase tracking-widest whitespace-nowrap">Afficher le MP3</span>
        </button>
      )}

      {open && (
        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-kov-steel hover:text-kov-bone transition-colors"
            style={{
              borderRadius: "var(--radius-pill)",
              background: "var(--glass-bg)",
              backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
              WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <ChevronDown size={12} />
            <span className="text-[9px] uppercase tracking-widest">Sortir le MP3</span>
          </button>

          {/* Device body — plastic-look gradient, not a raster image, so
              the screen inside can stay a real, live UI. */}
          <div
            className="p-4"
            style={{
              width: 280,
              borderRadius: 26,
              background: "linear-gradient(160deg, #333335 0%, #19191a 55%, #0c0c0d 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Screen */}
            <div
              className="p-3"
              style={{
                height: 176,
                borderRadius: 12,
                background: "#050505",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "inset 0 2px 10px rgba(0,0,0,0.8)",
              }}
            >
              {!hasTracks && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-kov-steel text-[10px] uppercase tracking-widest text-center px-2">Aucune piste</p>
                </div>
              )}

              {hasTracks && mode === "now-playing" && track && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-kov-steel text-[9px] uppercase tracking-widest font-mono">
                      {String(trackIndex + 1).padStart(2, "0")}/{String(LOUNGE_TRACKS.length).padStart(2, "0")}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("list");
                        setCursorIndex(trackIndex);
                      }}
                      className="text-kov-steel hover:text-kov-red transition-colors text-[9px] uppercase tracking-widest"
                    >
                      Tous les titres
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center text-center px-2 min-h-0">
                    {track.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element -- tiny local cover art, not worth next/image's overhead in a 56px thumbnail
                      <img src={track.cover} alt="" className="w-14 h-14 object-cover mb-3" style={{ borderRadius: 8 }} />
                    ) : (
                      <div
                        className="w-14 h-14 mb-3 flex items-center justify-center shrink-0"
                        style={{ borderRadius: 8, background: "rgba(227,30,36,0.12)" }}
                      >
                        <span aria-hidden="true" className="flex items-end gap-0.5 h-5">
                          {[6, 14, 9, 18, 11].map((h, i) => (
                            <span
                              key={i}
                              className="w-0.5"
                              style={{ height: h, background: "var(--kov-red)", opacity: isPlaying ? 1 : 0.4 }}
                            />
                          ))}
                        </span>
                      </div>
                    )}
                    <p className="text-kov-bone text-xs truncate max-w-full">{track.title}</p>
                    <p className="text-kov-steel text-[10px] truncate max-w-full">{track.artist}</p>
                  </div>

                  <div>
                    <div className="h-0.5 w-full" style={{ background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                      <div
                        className="h-full"
                        style={{
                          width: progress.duration ? `${Math.min(100, (progress.current / progress.duration) * 100)}%` : "0%",
                          background: "var(--kov-red)",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-kov-steel text-[8px] font-mono">{formatTime(progress.current)}</span>
                      <span className="text-kov-steel text-[8px] font-mono">{formatTime(progress.duration)}</span>
                    </div>
                  </div>
                </div>
              )}

              {hasTracks && mode === "list" && (
                <div className="h-full overflow-y-auto pr-1">
                  {LOUNGE_TRACKS.map((t, i) => (
                    <button
                      key={t.src}
                      type="button"
                      onClick={() => selectTrack(i)}
                      className="w-full text-left px-1.5 py-1.5 flex items-center gap-2"
                      style={{ borderRadius: 6, background: i === cursorIndex ? "var(--kov-red)" : "transparent" }}
                    >
                      <span className={`text-[9px] font-mono shrink-0 ${i === cursorIndex ? "text-kov-white" : "text-kov-steel"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[11px] truncate ${i === cursorIndex ? "text-kov-white" : "text-kov-bone"}`}>
                          {t.title}
                        </span>
                      </span>
                      {i === trackIndex && (
                        <span
                          aria-hidden="true"
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ background: i === cursorIndex ? "var(--kov-white)" : "var(--kov-red)" }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Click wheel */}
            <div className="mt-4 flex items-center justify-center">
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: 168,
                  height: 168,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 30%, #4a4a4c, #201f20 70%)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 6px 14px rgba(0,0,0,0.5)",
                }}
              >
                <button
                  type="button"
                  onClick={() => moveCursor(-1)}
                  aria-label="Titre précédent dans la liste"
                  className="absolute top-2.5 left-1/2 -translate-x-1/2 text-kov-bone/80 hover:text-kov-red transition-colors"
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => moveCursor(1)}
                  aria-label="Titre suivant dans la liste"
                  className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-kov-bone/80 hover:text-kov-red transition-colors"
                >
                  <ChevronDown size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Piste précédente"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-kov-bone/80 hover:text-kov-red transition-colors"
                >
                  <SkipBack size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Piste suivante"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-kov-bone/80 hover:text-kov-red transition-colors"
                >
                  <SkipForward size={17} />
                </button>

                <button
                  type="button"
                  onClick={pressCenter}
                  aria-label={mode === "list" ? "Sélectionner la piste" : isPlaying ? "Mettre en pause" : "Lecture"}
                  className="flex items-center justify-center"
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: "50%",
                    background: "linear-gradient(160deg, #232325, #050505)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  {mode === "now-playing" ? (
                    isPlaying ? (
                      <Pause size={20} className="text-kov-bone" />
                    ) : (
                      <Play size={20} className="text-kov-bone ml-0.5" />
                    )
                  ) : (
                    <span className="text-kov-bone text-[9px] uppercase tracking-widest">OK</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
