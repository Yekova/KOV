"use client";

import { useEffect, useRef } from "react";
import { damp } from "@/lib/damp";

interface MouseFrameBackdropProps {
  basePath: string;
  frameCount: number;
  poster: string;
}

// Lowered from 10 — a slower damped follow reads as heavier/more fluid
// (more momentum before it catches up to the cursor) rather than a snappy
// 1:1 track. Requested specifically for /login, the only current consumer
// of this component, so tuned directly here rather than left generic.
const LAMBDA = 6;
// >1 means a mouse sweep across less than the full viewport width already
// reaches the sequence's first/last frame — the rotation reads as more
// pronounced for normal cursor movement instead of needing an edge-to-edge
// sweep to see the full range.
const SENSITIVITY = 1.6;
// Frames are pre-composited on a black background matching --kov-black
// (see the note below on why this isn't scaled down), but the character
// itself only occupies a small fraction of each frame — most of the frame
// reads as plain empty black. Scaling the whole image up crops that
// margin away (the excess pushes past the viewport edge and is clipped),
// making the character itself notably more present without touching the
// source frames.
const IMAGE_SCALE = 1.35;

function frameUrl(basePath: string, index: number) {
  return `${basePath}/frame-${String(index).padStart(3, "0")}.jpg`;
}

// Full-viewport backdrop, frame-sequence version — ambient mouse position (not
// drag, not scroll) directly indexes into a pre-rendered, pre-extracted frame
// sequence: mouse left → frames further left in the sequence, mouse right →
// frames further right, eased with the same damp() used everywhere else for
// organic (not 1:1-snappy) motion. Same fixed/z-canvas/pointer-events:none
// convention as SceneBackdrop.tsx. Currently only used by /login (character
// rotates in place) — built generic enough to reuse elsewhere with a
// different frame sequence, but the tuning below (LAMBDA/SENSITIVITY/
// IMAGE_SCALE) is specific to this one usage.
export function MouseFrameBackdrop({ basePath, frameCount, poster }: MouseFrameBackdropProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const targetProgress = useRef(0.5);
  const currentProgress = useRef(0.5);
  const lastFrameIndex = useRef(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reducedMotion || !finePointer) return;

    let cancelled = false;
    for (let i = 0; i < frameCount; i++) {
      const img = new window.Image();
      img.src = frameUrl(basePath, i);
    }

    function handlePointerMove(event: PointerEvent) {
      const centered = (event.clientX / window.innerWidth - 0.5) * SENSITIVITY;
      targetProgress.current = Math.min(1, Math.max(0, 0.5 + centered));
    }
    window.addEventListener("pointermove", handlePointerMove);

    let raf: number;
    let last = performance.now();
    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      currentProgress.current = damp(currentProgress.current, targetProgress.current, LAMBDA, dt);
      const frameIndex = Math.round(currentProgress.current * (frameCount - 1));
      if (frameIndex !== lastFrameIndex.current && imgRef.current && !cancelled) {
        imgRef.current.src = frameUrl(basePath, frameIndex);
        lastFrameIndex.current = frameIndex;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(raf);
    };
  }, [basePath, frameCount]);

  return (
    // overflow-hidden — required now that the image is scaled up past the
    // container's own bounds (see IMAGE_SCALE below); without it the
    // overscaled img would push real layout overflow past the viewport
    // edge (the same 100vw/scrollbar class of bug fixed elsewhere this
    // session), not just get visually clipped.
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: "var(--z-canvas)", pointerEvents: "none" }}>
      {/* Imperative src swaps on every animation frame — next/image's lazy-load/
          optimization lifecycle fights this pattern, so a plain img is correct here.
          Frames are pre-composited (see docs/KOV-CHARACTER.md) so character size/
          position within frame already lines up with page content. Scaling UP
          (not down) is safe despite the black-background seam this component
          used to avoid entirely: scaling down would reveal MORE of each frame's
          edge (where the seam lives), but scaling up pushes those edges further
          past the viewport, where the wrapper's overflow-hidden crops them —
          the seam is never in view. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={poster}
        alt=""
        className="w-full h-full object-cover"
        style={{ transform: `scale(${IMAGE_SCALE})` }}
      />
    </div>
  );
}
