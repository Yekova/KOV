"use client";

import { useRef, useState } from "react";

// Explicitly NOT a real analytics claim (spec §03: "ne présente pas de
// chiffres inventés comme statistiques réelles") — no unit, no "%", no
// number presented as fact. Hovering the curve reveals one of the spec's
// own suggested creative labels instead of a fabricated figure.
const LABELS = ["DESIGN", "MOTION", "RESPONSIVE", "IMPACT"];
// 8 points (was 4) grouped two-per-label, for a curve detailed enough that
// straight-line segments between them would read as jagged rather than a
// deliberate wave.
const RAW_VALUES = [82, 70, 74, 58, 63, 42, 48, 18];
const POINTS = RAW_VALUES.map((y, i) => ({ x: (i / (RAW_VALUES.length - 1)) * 100, y }));
const GRID_LINES = [25, 50, 75];

// Catmull-Rom → cubic Bezier conversion (tension 1/6, the standard
// coefficient) — turns the straight-segment polyline into a genuinely
// smooth curve through every point, instead of a jagged line chart.
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

const LINE_PATH = smoothPath(POINTS);
const AREA_PATH = `${LINE_PATH} L100,100 L0,100 Z`;

export function PerformanceContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const activeIndex = hovered ?? POINTS.length - 1;
  const active = POINTS[activeIndex];
  const activeLabel = LABELS[Math.min(Math.floor(activeIndex / 2), LABELS.length - 1)];

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
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full bg-kov-red"
          style={{ boxShadow: hovered !== null ? "0 0 6px var(--kov-red)" : "none" }}
        />
      </div>

      {/* Grid lines + curve/fill are plain SVG (a distorted viewBox stretch
          doesn't break a straight horizontal line or a path's overall
          shape). The marker dot and guide line are regular HTML instead —
          a plain SVG circle would render as an ellipse under this same
          non-uniform stretch once the card isn't square. */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="hero-impact-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--kov-red)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--kov-red)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {GRID_LINES.map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={AREA_PATH} fill="url(#hero-impact-fill)" stroke="none" />
        <path d={LINE_PATH} fill="none" stroke="var(--kov-red)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </svg>

      <div
        aria-hidden="true"
        className="absolute top-0 bottom-0 w-px pointer-events-none transition-[left] duration-150"
        style={{ left: `${active.x}%`, background: "rgba(255,255,255,0.14)" }}
      />
      <div
        aria-hidden="true"
        className="absolute w-2 h-2 rounded-full pointer-events-none transition-[left,top] duration-150"
        style={{
          left: `${active.x}%`,
          top: `${active.y}%`,
          transform: "translate(-50%, -50%)",
          background: "var(--kov-bone)",
          border: "1.5px solid var(--kov-red)",
          boxShadow: "0 0 8px rgba(227,30,36,0.6)",
        }}
      />

      <p className="absolute bottom-4 left-4 text-kov-bone text-xs uppercase tracking-widest">{activeLabel}</p>
    </div>
  );
}
