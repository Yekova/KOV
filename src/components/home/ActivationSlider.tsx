"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion, useMotionValue, useMotionValueEvent, useTransform, animate, AnimatePresence } from "framer-motion";
import { GlassSurface } from "@/components/ui/GlassSurface";

const HANDLE_SIZE = 76;
const TRACK_INSET = 8;
const ACTIVATION_THRESHOLD = 0.92;
const RELEASE_SPRING = { type: "spring" as const, stiffness: 320, damping: 28 };

interface ActivationSliderProps {
  onActivate: () => void;
  reducedMotion: boolean;
}

// The hero object of ActivationWindow — an iOS-style slide-to-unlock built
// on framer-motion's native drag system (spring release, pointer capture,
// touch support all handled by `drag="x"` + `dragConstraints`) rather than
// hand-rolled pointer-event math. Continuous drag feedback (glow, trail,
// label fade, fill width) is bound directly to MotionValues via
// useTransform — none of it touches React state, so dragging never
// triggers a re-render (the one performance constraint that actually
// matters here: 60fps during drag). aria-valuenow is the one exception —
// synced via useMotionValueEvent at 1%-of-travel granularity, coarse
// enough to be free but fine enough to stay live for screen readers.
export function ActivationSlider({ onActivate, reducedMotion }: ActivationSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [activated, setActivated] = useState(false);
  const [percent, setPercent] = useState(0);
  const x = useMotionValue(0);
  const maxTravel = Math.max(1, trackWidth - HANDLE_SIZE - TRACK_INSET * 2);

  const progress = useTransform(x, [0, maxTravel], [0, 1]);
  const fillWidth = useTransform(progress, (p) => `calc(${p * 100}% + ${HANDLE_SIZE / 2 + TRACK_INSET}px)`);
  const glowScale = useTransform(progress, [0, 1], [0.85, 1.4]);
  const glowOpacity = useTransform(progress, [0, 0.15, 1], [0.35, 0.8, 1]);
  const wideGlowScale = useTransform(glowScale, (s) => s * 1.8);
  const wideGlowOpacity = useTransform(glowOpacity, (o) => o * 0.5);
  const trailOpacity = useTransform(progress, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
  const labelOpacity = useTransform(progress, [0, 0.6, 1], [1, 0.3, 0]);
  const hintOpacity = useTransform(progress, [0, 0.4], [1, 0]);

  useMotionValueEvent(x, "change", (latest) => {
    setPercent(Math.round((latest / maxTravel) * 100));
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const ro = new ResizeObserver((entries) => setTrackWidth(entries[0].contentRect.width));
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  const finish = useCallback(() => {
    setActivated(true);
    animate(x, maxTravel, { duration: 0.25, ease: "easeOut" });
    onActivate();
  }, [x, maxTravel, onActivate]);

  function handleDragEnd() {
    if (x.get() / maxTravel >= ACTIVATION_THRESHOLD) {
      finish();
    } else {
      animate(x, 0, RELEASE_SPRING);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (activated) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      finish();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      animate(x, Math.min(maxTravel, x.get() + maxTravel * 0.12), RELEASE_SPRING);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      animate(x, Math.max(0, x.get() - maxTravel * 0.12), RELEASE_SPRING);
    }
  }

  return (
    <div className="relative w-full" style={{ maxWidth: 640 }}>
      <div
        ref={trackRef}
        className="relative w-full overflow-hidden"
        style={{ height: 96, borderRadius: "var(--radius-pill)" }}
      >
        {/* Liquid-glass refraction now lives on the track (was on the
            handle) — explicit pixel width from the same ResizeObserver
            measurement `maxTravel` already uses, not a percentage: this
            is a position:relative parent whose own width is measured, not
            ambiguous, but staying explicit avoids re-deriving that
            reasoning next time this is touched. Only rendered once a real
            measurement exists, so it never mounts at a momentary 0px. */}
        {trackWidth > 0 && (
          <GlassSurface width={trackWidth} height={96} borderRadius={999} style={{ position: "absolute", inset: 0 }} />
        )}

        {/* reflection sheen */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.07), transparent)" }}
        />

        {/* progress fill */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 pointer-events-none"
          style={{ width: fillWidth, background: "linear-gradient(90deg, rgba(227,30,36,0.4), rgba(227,30,36,0.03))" }}
        />

        {/* direction hint */}
        {!reducedMotion && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-y-0 flex items-center text-kov-red pointer-events-none"
            style={{ left: HANDLE_SIZE + TRACK_INSET + 22, opacity: hintOpacity, fontSize: 13 }}
          >
            <span className="tracking-tighter">›››</span>
          </motion.div>
        )}

        {/* label */}
        <motion.p
          className="absolute inset-y-0 flex items-center text-xs uppercase tracking-widest text-kov-bone whitespace-nowrap pointer-events-none"
          style={{ right: 60, opacity: labelOpacity }}
        >
          Glissez pour activer
        </motion.p>

        {/* lock icon — flips to unlocked on activation */}
        <span className="absolute right-5 inset-y-0 flex items-center text-kov-steel pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="9" rx="1.5" />
            <AnimatePresence mode="wait" initial={false}>
              {activated ? (
                <motion.path
                  key="open"
                  d="M8 11V7a4 4 0 0 1 7.3-2.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              ) : (
                <motion.path
                  key="closed"
                  d="M8 11V7a4 4 0 0 1 8 0v4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>
          </svg>
        </span>

        {/* trail — a few dots just ahead of the handle, fading as it approaches completion */}
        {!reducedMotion && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-y-0 flex items-center gap-2 pointer-events-none"
            style={{ x, marginLeft: HANDLE_SIZE + TRACK_INSET + 4, opacity: trailOpacity }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="rounded-full"
                style={{ width: 5, height: 5, background: "var(--kov-red-signal)", opacity: 1 - i * 0.3 }}
              />
            ))}
          </motion.div>
        )}

        {/* handle */}
        <motion.div
          role="slider"
          tabIndex={0}
          aria-label="Activer l'expérience KOV"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={activated ? 100 : percent}
          aria-valuetext={activated ? "Activé" : `${percent} pour cent`}
          drag={activated ? false : "x"}
          dragConstraints={{ left: 0, right: maxTravel }}
          dragElastic={0.03}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onKeyDown={handleKeyDown}
          style={{ x, left: TRACK_INSET, width: HANDLE_SIZE, height: HANDLE_SIZE }}
          className="absolute top-1/2 -translate-y-1/2 rounded-full cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {/* glow layers — core + wide atmospheric, both progress-driven */}
          {!reducedMotion && (
            <>
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  scale: glowScale,
                  opacity: glowOpacity,
                  background: "radial-gradient(circle, rgba(255,77,77,0.9), transparent 70%)",
                  filter: "blur(6px)",
                }}
              />
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  scale: wideGlowScale,
                  opacity: wideGlowOpacity,
                  background: "radial-gradient(circle, rgba(227,30,36,0.6), transparent 70%)",
                  filter: "blur(16px)",
                }}
              />
            </>
          )}

          {/* red color source — solid now (no GlassSurface refraction on
              top; that effect moved to the track, see above). The glossy
              read still comes through via these inset highlight/shadow
              layers alone. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 30%, var(--kov-red-signal), var(--kov-red) 55%, #7a1014 100%)",
              boxShadow:
                "inset 0 2px 5px rgba(255,255,255,0.3), inset 0 -6px 10px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.12)",
            }}
          />

          {/* arrow → check */}
          <span className="absolute inset-0 flex items-center justify-center text-kov-white pointer-events-none">
            <AnimatePresence mode="wait" initial={false}>
              {activated ? (
                <motion.svg
                  key="check"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <path d="M5 13l4 4L19 7" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="arrow"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <path d="M5 12h13M13 6l7 6-7 6" />
                </motion.svg>
              )}
            </AnimatePresence>
          </span>
        </motion.div>
      </div>

      <p className="mt-4 text-center text-[11px] uppercase tracking-widest text-kov-steel">
        {activated ? "Site activé." : "Glissez de gauche à droite pour activer votre site"}
      </p>
    </div>
  );
}
