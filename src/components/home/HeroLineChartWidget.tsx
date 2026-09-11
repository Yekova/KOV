"use client";

import { useRef, useState } from "react";

// Illustrative only — same reasoning as the bar chart it replaces: no unit,
// no "%", no headline claim attached, so this reads as a sample interface
// (a capability demo) rather than an asserted fact about KOV's own
// performance. Month labels are the one literal thing here.
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
const VALUES = [22, 30, 26, 38, 34, 46, 42, 58, 52, 68, 62, 78];

const MAX_VALUE = Math.max(...VALUES);
// Percentages (0-100) for both axes — used identically to build the SVG
// path *and* to position the plain HTML dot/guide-line overlay below, so
// the two stay in sync without re-deriving the geometry twice.
const POINTS = VALUES.map((value, i) => ({
  x: (i / (VALUES.length - 1)) * 100,
  y: 92 - (value / MAX_VALUE) * 80,
}));

const LINE_PATH = POINTS.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
const AREA_PATH = `${LINE_PATH} L100,100 L0,100 Z`;

export function HeroLineChartWidget() {
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
      style={{ borderRadius: 18, background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
    >
      <div className="relative z-10 flex items-center justify-between">
        <p className="text-kov-steel text-[10px] uppercase tracking-widest">Activité</p>
        <span className="text-kov-red text-xs tabular-nums">{VALUES[activeIndex]}</span>
      </div>

      {/* The path/fill are drawn with a non-uniform viewBox stretch (fine
          for a line — it's meant to fill the card's own aspect ratio), but
          a plain SVG circle scaled the same way would render as an
          ellipse, not a dot — so the interactive marker and guide line
          below are plain HTML positioned with the same x/y percentages
          instead of going through the SVG's coordinate transform. */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="hero-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--kov-red)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--kov-red)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={AREA_PATH} fill="url(#hero-line-fill)" stroke="none" />
        <path d={LINE_PATH} fill="none" stroke="var(--kov-red)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>

      <div
        aria-hidden="true"
        className="absolute top-0 bottom-0 w-px pointer-events-none"
        style={{ left: `${active.x}%`, background: "var(--glass-border)" }}
      />
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

      <p
        className="absolute bottom-3 text-kov-steel text-[9px] uppercase tracking-wide pointer-events-none"
        style={{ left: `${active.x}%`, transform: "translateX(-50%)" }}
      >
        {MONTHS[activeIndex]}
      </p>
    </div>
  );
}
