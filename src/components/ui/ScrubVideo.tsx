"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { damp } from "@/lib/damp";

export interface ScrubVideoHandle {
  /** Ease the video to a given position (0..1 of its duration). */
  seekTo: (progress: number) => void;
}

interface ScrubVideoProps {
  src: string;
  poster: string;
  aspectRatio?: string;
  className?: string;
  /** Fires on drag and during ambient playback with the current 0..1 position. */
  onProgressChange?: (progress: number) => void;
}

const RESUME_DELAY_MS = 400;
const SEEK_LAMBDA = 8;

// Drag-to-scrub a pre-rendered character video — see docs/KOV-CHARACTER.md.
// Reuses the same border/blur/shadow tokens as GlassCard, not GlassCard
// itself: GlassCard's entire effect is its translucent tinted background,
// which a full-bleed `object-fit: cover` video on top would fully occlude.
export const ScrubVideo = forwardRef<ScrubVideoHandle, ScrubVideoProps>(function ScrubVideo(
  { src, poster, aspectRatio, className = "", onProgressChange },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onProgressChangeRef = useRef(onProgressChange);
  onProgressChangeRef.current = onProgressChange;

  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);
  const dragWidth = useRef(0);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const easeFrame = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    if (!reducedMotion) {
      video.loop = true;
      video.play().catch(() => {});
    }

    function reportProgress() {
      if (video && video.duration) onProgressChangeRef.current?.(video.currentTime / video.duration);
    }
    video.addEventListener("timeupdate", reportProgress);

    if (reducedMotion || !finePointer) {
      return () => video.removeEventListener("timeupdate", reportProgress);
    }

    function cancelEase() {
      if (easeFrame.current !== null) cancelAnimationFrame(easeFrame.current);
      easeFrame.current = null;
    }

    function scheduleResume() {
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
      resumeTimeout.current = setTimeout(() => {
        video?.play().catch(() => {});
      }, RESUME_DELAY_MS);
    }

    function handlePointerDown(event: PointerEvent) {
      if (!video || !video.duration) return;
      dragging.current = true;
      dragStartX.current = event.clientX;
      dragStartTime.current = video.currentTime;
      dragWidth.current = container!.getBoundingClientRect().width;
      cancelEase();
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
      video.pause();
      container!.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragging.current || !video || !dragWidth.current) return;
      const deltaX = event.clientX - dragStartX.current;
      const deltaTime = (deltaX / dragWidth.current) * video.duration;
      video.currentTime = Math.min(video.duration, Math.max(0, dragStartTime.current + deltaTime));
      // `timeupdate` doesn't fire reliably on every programmatic seek, so the
      // progress callback (degree readout, marker highlight) would lag behind
      // the drag — report it directly here instead of waiting for the event.
      onProgressChangeRef.current?.(video.currentTime / video.duration);
    }

    function handlePointerUp() {
      if (!dragging.current) return;
      dragging.current = false;
      scheduleResume();
    }

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointercancel", handlePointerUp);

    return () => {
      video.removeEventListener("timeupdate", reportProgress);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointercancel", handlePointerUp);
      cancelEase();
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    seekTo(progress: number) {
      const video = videoRef.current;
      if (!video || !video.duration) return;
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
      if (easeFrame.current !== null) cancelAnimationFrame(easeFrame.current);
      video.pause();

      const targetTime = Math.min(1, Math.max(0, progress)) * video.duration;
      let last = performance.now();

      function tick(now: number) {
        if (!video) return;
        const dt = (now - last) / 1000;
        last = now;
        const next = damp(video.currentTime, targetTime, SEEK_LAMBDA, dt);
        video.currentTime = next;
        if (Math.abs(targetTime - next) > 0.02) {
          easeFrame.current = requestAnimationFrame(tick);
        } else {
          video.currentTime = targetTime;
          easeFrame.current = null;
          resumeTimeout.current = setTimeout(() => video.play().catch(() => {}), RESUME_DELAY_MS);
        }
      }
      easeFrame.current = requestAnimationFrame(tick);
    },
  }));

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing ${className}`}
      style={{
        aspectRatio,
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-glass)",
        boxShadow: "var(--glass-shadow-full)",
        background: "var(--kov-carbon)",
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="metadata"
        className="w-full h-full object-cover pointer-events-none"
      />
    </div>
  );
});
