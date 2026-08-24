"use client";

import { useEffect, useRef, useState } from "react";

const RING_COUNT = 5;

// Small decorative wireframe-sphere accent for the footer's lower-right —
// a plain set of latitude ellipses slowly rotating, canvas 2D (no WebGL
// needed for simple ellipse outlines), same ambient-texture idiom as
// ArchitecturalGrid. Purely decorative, aria-hidden.
export function FooterGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const radius = size / 2 - 4;
    const center = size / 2;

    function draw(phase: number) {
      ctx!.clearRect(0, 0, size, size);

      const glow = ctx!.createRadialGradient(center, center, radius * 0.2, center, center, radius * 1.15);
      glow.addColorStop(0, "rgba(227, 30, 36, 0.18)");
      glow.addColorStop(1, "rgba(227, 30, 36, 0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, size, size);

      ctx!.strokeStyle = "rgba(231, 231, 229, 0.25)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.arc(center, center, radius, 0, Math.PI * 2);
      ctx!.stroke();

      for (let i = 1; i < RING_COUNT; i++) {
        const t = i / RING_COUNT;
        const scaleY = Math.sin(t * Math.PI);
        ctx!.beginPath();
        ctx!.ellipse(center, center, radius, radius * scaleY * 0.9, 0, 0, Math.PI * 2);
        ctx!.stroke();
      }

      for (let i = 0; i < RING_COUNT; i++) {
        const angle = phase + (i / RING_COUNT) * Math.PI;
        const scaleX = Math.abs(Math.sin(angle));
        ctx!.beginPath();
        ctx!.ellipse(center, center, radius * scaleX, radius, 0, 0, Math.PI * 2);
        ctx!.stroke();
      }

      ctx!.fillStyle = "var(--kov-red, #E31E24)";
      ctx!.beginPath();
      ctx!.arc(center + radius * 0.3, center - radius * 0.4, 2, 0, Math.PI * 2);
      ctx!.fill();
    }

    if (reducedMotion) {
      draw(0);
      return;
    }

    let raf = 0;
    let start: number | null = null;
    function tick(now: number) {
      if (start === null) start = now;
      draw(((now - start) / 1000) * 0.3);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
