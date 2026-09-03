"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const KNOB_SIZE = 72;
const TRACK_INSET = 8;
const COMPLETE_THRESHOLD = 0.82;

// The immersive window's own content, once it's fully "dived into" — a
// slide-to-activate control (iOS-style slide-to-unlock, applied to KOV's
// own dark/red palette) rather than a plain click, matching the reference
// the user supplied directly. Proves the section's own promise ("Un site
// qui vous ressemble") through a real gesture instead of describing it.
// Self-contained: owns all its own state, no scroll-awareness here —
// ImmersiveShowcase only wraps this in a div whose pointer-events it
// toggles once the dive has actually settled.
//
// Drag position lives in plain React state, not GSAP-driven refs like the
// page's scroll-linked animations — pointermove on one small local widget
// isn't the same class of problem the codebase's scroll code optimizes
// for, this is an ordinary React drag slider (same weight as
// ContactWizard's own useState-driven selectable cards). Track width is
// measured via ResizeObserver into state rather than read from the ref
// during render, so the knob's travel distance stays correct on resize
// and is available on the very first paint.
export function FeatureDemo() {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const ro = new ResizeObserver((entries) => setTrackWidth(entries[0].contentRect.width));
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  const progressFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const usable = rect.width - KNOB_SIZE - TRACK_INSET * 2;
    if (usable <= 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left - TRACK_INSET - KNOB_SIZE / 2) / usable));
  }, []);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (activated) return;
    draggingRef.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    setProgress(progressFromClientX(e.clientX));
  }

  function release() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    setProgress((p) => {
      if (p >= COMPLETE_THRESHOLD) {
        setActivated(true);
        return 1;
      }
      return 0;
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (activated) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setProgress(1);
      setActivated(true);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setProgress((p) => Math.min(1, p + 0.1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setProgress((p) => Math.max(0, p - 0.1));
    }
  }

  const visualProgress = activated ? 1 : progress;
  const travel = Math.max(0, trackWidth - KNOB_SIZE - TRACK_INSET * 2);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl px-6">
      <div
        ref={trackRef}
        className="relative w-full select-none"
        style={{
          height: 88,
          borderRadius: "var(--radius-pill)",
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          boxShadow: `var(--glass-shadow-full), 0 30px 70px -20px rgba(227, 30, 36, ${0.25 + visualProgress * 0.25})`,
          overflow: "hidden",
        }}
      >
        <p className="absolute top-4 right-6 font-display text-kov-red" style={{ fontSize: 14 }}>
          KOV
        </p>

        {/* Fill trailing the knob */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0"
          style={{
            width: `calc(${visualProgress * 100}% + ${KNOB_SIZE / 2 + TRACK_INSET}px)`,
            background: "linear-gradient(90deg, rgba(227,30,36,0.35), rgba(227,30,36,0.04))",
            transition: dragging ? "none" : "width 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {/* Direction hint — fades out as the knob approaches it */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 flex items-center gap-1.5 text-kov-red"
          style={{ left: KNOB_SIZE + TRACK_INSET + 20, opacity: Math.max(0, 1 - visualProgress * 2.5) }}
        >
          <span className="tracking-tighter" style={{ fontSize: 13 }}>
            ›››
          </span>
          <span aria-hidden="true">→</span>
        </div>

        {/* Label — fades out as the knob covers it */}
        <p
          className="absolute inset-y-0 flex items-center text-xs uppercase tracking-widest text-kov-steel whitespace-nowrap"
          style={{ right: 56, opacity: Math.max(0, 1 - visualProgress * 1.8) }}
        >
          {activated ? "Site activé" : "Activer votre site"}
        </p>

        {/* Lock icon, right edge — swaps to unlocked once activated */}
        <span className="absolute right-5 inset-y-0 flex items-center text-kov-steel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="9" rx="1.5" />
            {activated ? <path d="M8 11V7a4 4 0 0 1 7.3-2.5" /> : <path d="M8 11V7a4 4 0 0 1 8 0v4" />}
          </svg>
        </span>

        {/* Knob */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Activer votre site"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(visualProgress * 100)}
          aria-valuetext={activated ? "Activé" : `${Math.round(visualProgress * 100)} pour cent`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={release}
          onPointerCancel={release}
          onKeyDown={handleKeyDown}
          className="absolute top-1/2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            left: TRACK_INSET,
            transform: `translate(${visualProgress * travel}px, -50%)`,
            transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            borderRadius: "50%",
            background: "var(--kov-red)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.15), 0 0 30px 6px rgba(227,30,36,0.55)",
            cursor: activated ? "default" : "grab",
            outlineColor: "var(--kov-red)",
            touchAction: "none",
          }}
        />
      </div>

      <p className="text-[11px] uppercase tracking-widest text-kov-steel text-center">
        {activated ? "Système intégré, prêt à être configuré." : "Glissez de gauche à droite pour activer votre site"}
      </p>
    </div>
  );
}
