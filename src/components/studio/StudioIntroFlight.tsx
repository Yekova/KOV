"use client";

import { useEffect, useRef, useState } from "react";

const SRC = "/studio/intro/flight.mp4";
const POSTER = "/studio/intro/flight-poster.webp";
// The file is 10s at 24fps. The cap is a safety net, not a schedule: if the
// `ended` event never fires — a decode failure, a tab backgrounded mid-play,
// an autoplay policy that stopped it — the visitor still reaches the studio.
const HARD_STOP_MS = 12_000;

// The descent. Plays once between "Entrer dans le studio" and the studio
// itself: clouds, then a building, then the room.
//
// It exists to make the arrival feel like arriving somewhere rather than
// like a page finishing its load, so everything here is arranged around not
// getting in the way of that:
//
//  - muted + playsInline, because an autoplaying video with sound is blocked
//    by every browser and would fail silently.
//  - a skip control from the first frame. Ten seconds is short, but it is
//    ten seconds someone who has already seen it cannot get back, and a
//    forced cinematic with no exit is a hostile piece of design.
//  - the poster is the video's own first frame, and the loading screen is
//    coloured from that same frame — so the handover is a video starting to
//    move, not a cut.
//  - if play() is rejected outright, we do not sit on a frozen frame: the
//    tour continues.
export function StudioIntroFlight({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Guarded so `ended`, the hard stop and the skip button can all race
    // without the phase advancing twice.
    function finish() {
      if (doneRef.current) return;
      doneRef.current = true;
      setLeaving(true);
      window.setTimeout(onDone, 600);
    }

    const video = videoRef.current;
    const timer = window.setTimeout(finish, HARD_STOP_MS);

    video?.play().catch(() => {
      // Autoplay refused, or the file failed. Nothing to show, so do not
      // make the visitor wait out the timeout in front of a still frame.
      finish();
    });

    video?.addEventListener("ended", finish);
    return () => {
      window.clearTimeout(timer);
      video?.removeEventListener("ended", finish);
    };
  }, [onDone]);

  function skip() {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    window.setTimeout(onDone, 350);
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        zIndex: "var(--z-modal)" as unknown as number,
        background: "#c5d1d9",
        opacity: leaving ? 0 : 1,
        transition: "opacity 600ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <video
        ref={videoRef}
        src={SRC}
        poster={POSTER}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* A hint of the studio's own darkness creeping in at the edges, so the
          frame is already turning toward the room before the cut. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(10,10,10,0.55))" }}
      />

      <button
        type="button"
        onClick={skip}
        className="absolute bottom-8 right-8 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-kov-white transition-colors"
        style={{
          borderRadius: "var(--radius-pill)",
          background: "rgba(10,10,10,0.42)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.22)",
        }}
      >
        Passer l&apos;intro →
      </button>
    </div>
  );
}
