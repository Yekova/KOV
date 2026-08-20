"use client";

import { useEffect, useRef } from "react";

interface LoginCharacterBackdropProps {
  src: string;
  poster: string;
}

const SCROLL_SENSITIVITY = 1 / 1400; // px of cumulative horizontal scroll to cover the full clip

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Full-viewport backdrop — same fixed/z-canvas/pointer-events:none convention as
// SceneBackdrop.tsx (the homepage's scroll-driven scene layer). object-fit: contain,
// not cover: the source clip is a tall 9:16 portrait, and this page's near-black
// background matches the clip's own dark backdrop closely enough that letterboxing
// reads as the character standing in the page's own darkness, not as a boxed video.
export function LoginCharacterBackdrop({ src, poster }: LoginCharacterBackdropProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progress = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    video.loop = true;
    video.play().catch(() => {});

    let scrubbing = false;
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null;

    function handleWheel(event: WheelEvent) {
      if (!video || !video.duration) return;
      // Only hijack an actual horizontal gesture (trackpad swipe) or an explicit
      // shift+wheel — plain vertical scroll/wheel passes through untouched.
      const horizontalDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0;
      if (horizontalDelta === 0) return;

      event.preventDefault();
      if (!scrubbing) {
        scrubbing = true;
        video.pause();
      }
      if (resumeTimeout) clearTimeout(resumeTimeout);

      progress.current = clamp(progress.current + horizontalDelta * SCROLL_SENSITIVITY, 0, 1);
      video.currentTime = progress.current * video.duration;

      resumeTimeout = setTimeout(() => {
        scrubbing = false;
        video?.play().catch(() => {});
      }, 500);
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (resumeTimeout) clearTimeout(resumeTimeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: "var(--z-canvas)", pointerEvents: "none" }}>
      <video ref={videoRef} src={src} poster={poster} muted playsInline preload="metadata" className="w-full h-full object-contain" />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(10, 10, 10, 0.65) 100%)" }}
      />
    </div>
  );
}
