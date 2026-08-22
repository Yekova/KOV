"use client";

import { useEffect, useRef, useState } from "react";

const SPACING = 64;
const DRIFT_PX_PER_SEC = 6;
const LINE_COLOR = "rgba(231, 231, 229, 0.12)"; // --kov-grid-line, hardcoded: canvas 2D can't read CSS custom properties

// Ambient texture behind the Hero, replacing the removed cinematic video — a
// plain axis-aligned line grid slowly drifting so it feels alive without
// competing with the headline sitting on top. Canvas 2D, not WebGL — dead
// simple for straight lines, no new dependency. Ties into the
// "systems/architecture" language already in KOV-BRAND.md's Systèmes pillar,
// and finally puts --kov-grid-line (defined in tokens.css, unused until now)
// to use. Sizes itself from its own parent element, so the caller just needs
// to render this as the first child of a `position: relative` container with
// real height.
export function ArchitecturalGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Lazy initializer, not a setState-in-effect call — see Reveal.tsx.
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const containerEl = canvasEl?.parentElement;
    const context = canvasEl?.getContext("2d");
    if (!canvasEl || !containerEl || !context) return;

    // Re-bound to non-nullable types: TS narrowing from the guard above
    // doesn't carry into the nested functions below, which close over these.
    const canvas: HTMLCanvasElement = canvasEl;
    const container: HTMLElement = containerEl;
    const ctx: CanvasRenderingContext2D = context;

    let width = 0;
    let height = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function draw(offset: number) {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 1;
      const start = -SPACING + (offset % SPACING);
      for (let x = start; x < width + SPACING; x += SPACING) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = start; y < height + SPACING; y += SPACING) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    if (reducedMotion) {
      draw(0);
      return () => resizeObserver.disconnect();
    }

    let raf = 0;
    let startTime: number | null = null;
    function tick(now: number) {
      if (startTime === null) startTime = now;
      draw(((now - startTime) / 1000) * DRIFT_PX_PER_SEC);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: "var(--z-canvas)" }}
    />
  );
}
