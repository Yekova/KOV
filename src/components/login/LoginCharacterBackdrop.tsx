"use client";

import { useEffect, useRef } from "react";
import { damp } from "@/lib/damp";

interface LoginCharacterBackdropProps {
  basePath: string;
  frameCount: number;
  poster: string;
}

const LAMBDA = 10;

function frameUrl(basePath: string, index: number) {
  return `${basePath}/frame-${String(index).padStart(3, "0")}.jpg`;
}

// Full-viewport backdrop, frame-sequence version — ambient mouse position (not
// drag, not scroll) directly indexes into a pre-rendered, pre-extracted frame
// sequence: mouse left → frames further left in the sequence, mouse right →
// frames further right, eased with the same damp() used everywhere else for
// organic (not 1:1-snappy) motion. Same fixed/z-canvas/pointer-events:none
// convention as SceneBackdrop.tsx.
export function LoginCharacterBackdrop({ basePath, frameCount, poster }: LoginCharacterBackdropProps) {
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
      targetProgress.current = Math.min(1, Math.max(0, event.clientX / window.innerWidth));
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
    <div className="fixed inset-0" style={{ zIndex: "var(--z-canvas)", pointerEvents: "none" }}>
      {/* Imperative src swaps on every animation frame — next/image's lazy-load/
          optimization lifecycle fights this pattern, so a plain img is correct here.
          The frames themselves are pre-composited (see docs/KOV-CHARACTER.md) so the
          character's size/position within frame already lines up with page content —
          no CSS transform here, since scaling the element down reveals a seam between
          the frame's pure-black background and --kov-black (they don't quite match). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src={poster} alt="" className="w-full h-full object-cover" />
    </div>
  );
}
