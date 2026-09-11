"use client";

import { useRef, useState } from "react";

// Explicitly NOT a real analytics claim (spec §03: "ne présente pas de
// chiffres inventés comme statistiques réelles") — no unit, no "%", no
// number presented as fact. Hovering the curve reveals one of the spec's
// own suggested creative labels instead of a fabricated figure.
const LABELS = ["DESIGN", "MOTION", "RESPONSIVE", "IMPACT"];
const POINTS = [
  { x: 0, y: 78 },
  { x: 33, y: 55 },
  { x: 66, y: 62 },
  { x: 100, y: 20 },
];

const LINE_PATH = POINTS.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
const AREA_PATH = `${LINE_PATH} L100,100 L0,100 Z`;

export function PerformanceContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const activeIndex = hovered ?? POINTS.length - 1;
  const active = POINTS[activeIndex];

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fraction = (event.clientX - rect.left) / rect.width;
    const index = Math.round(fraction * (POINTS.length - 1));
    setHovered(Math.min(Math.max(index, 0), POINTS.length - 1));
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setHovered(null)}
      className="relative h-full w-full p-4 overflow-hidden"
      style={{ borderRadius: 20 }}
    >
      <div className="relative z-10 flex items-center justify-between">
        <p className="text-kov-steel text-[10px] uppercase tracking-widest">Impact</p>
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
      </div>

      {/* Same reasoning as the homepage hero's own line chart: a plain SVG
          circle would distort into an ellipse under this non-uniform
          viewBox stretch, so the marker is a regular HTML dot positioned
          with the same x/y percentages instead of drawn in SVG space. */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="hero-impact-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--kov-red)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--kov-red)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={AREA_PATH} fill="url(#hero-impact-fill)" stroke="none" />
        <path d={LINE_PATH} fill="none" stroke="var(--kov-red)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>

      <div
        aria-hidden="true"
        className="absolute w-2 h-2 rounded-full pointer-events-none"
        style={{
          left: `${active.x}%`,
          top: `${active.y}%`,
          transform: "translate(-50%, -50%)",
          background: "var(--kov-bone)",
          border: "1.5px solid var(--kov-red)",
        }}
      />

      <p className="absolute bottom-4 left-4 text-kov-bone text-xs uppercase tracking-widest">{LABELS[activeIndex]}</p>
    </div>
  );
}
