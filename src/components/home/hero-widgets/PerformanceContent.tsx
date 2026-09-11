"use client";

import { useRef, useState } from "react";

// Explicitly NOT a real analytics claim (spec §14: "si les statistiques ne
// sont pas réelles, elles doivent rester clairement démonstratives") — the
// small "Aperçu" tag keeps that honest without cluttering the "Impact" /
// "+62%" / "Engagement" headline the brief asked for verbatim.
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
const VALUES = [24, 31, 38, 45, 48, 62];
const POINTS = VALUES.map((v, i) => ({ x: (i / (VALUES.length - 1)) * 100, y: 92 - (v / 62) * 74 }));

// Catmull-Rom → cubic Bezier (tension 1/6) — an actual smooth curve
// through every point rather than straight jagged segments (spec §15:
// "je veux... SVG propre").
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
  const isDefault = hovered === null;

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
      className="relative h-full w-full p-4 overflow-hidden flex flex-col"
      style={{ borderRadius: 20 }}
    >
      <div className="relative z-10 flex items-start justify-between">
        <p className="flex items-center gap-2 text-kov-steel text-[10px] uppercase tracking-widest">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
          Impact
        </p>
        <span className="text-kov-steel text-[8px] uppercase tracking-widest opacity-40">Aperçu</span>
      </div>

      <div className="relative z-10 mt-1">
        <span className="font-display text-kov-bone" style={{ fontSize: "clamp(24px, 2.6vw, 34px)" }}>
          +{VALUES[activeIndex]}%
        </span>
        <p className="text-kov-steel text-[10px] uppercase tracking-widest mt-0.5">
          Engagement{!isDefault && <span className="text-kov-red"> · {MONTHS[activeIndex]}</span>}
        </p>
      </div>

      {/* Grid-free, fine stroke curve (spec §15: "pas de bar chart
          générique") — points stay invisible except the hovered one and
          the last (default) point, which keeps a faint permanent halo. */}
      <div className="relative flex-1 min-h-0 mt-2">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="hero-impact-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--kov-red)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--kov-red)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={AREA_PATH} fill="url(#hero-impact-fill)" stroke="none" />
          <path d={LINE_PATH} fill="none" stroke="var(--kov-red)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        </svg>

        {/* Plain HTML dot, not an SVG circle — this viewBox stretches
            non-uniformly to fill a non-square card, which would distort a
            true SVG circle into an ellipse. */}
        <div
          aria-hidden="true"
          className="absolute w-1.5 h-1.5 rounded-full pointer-events-none transition-[left,top] duration-150"
          style={{
            left: `${active.x}%`,
            top: `${active.y}%`,
            transform: "translate(-50%, -50%)",
            background: "var(--kov-bone)",
            border: "1.5px solid var(--kov-red)",
            boxShadow: isDefault ? "0 0 6px rgba(227,30,36,0.5)" : "0 0 8px rgba(227,30,36,0.7)",
          }}
        />

        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between">
          {MONTHS.map((month, i) => (
            <span
              key={month}
              className="text-[8px] uppercase tracking-wide transition-colors"
              style={{ color: i === activeIndex ? "var(--kov-bone)" : "var(--kov-steel)" }}
            >
              {month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
