"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

export type RevenuePoint = { label: string; cents: number };

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

// Real paid-invoice revenue, bucketed by month server-side (see
// admin/page.tsx) — no interpolation or projection, months with zero paid
// invoices just show as zero.
export function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const width = 600;
  const height = 180;
  const max = Math.max(...points.map((p) => p.cents), 1);

  const coords = points.map((p, i) => {
    const x = points.length > 1 ? (i / (points.length - 1)) * width : 0;
    const y = height - (p.cents / max) * height;
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const active = hovered !== null ? coords[hovered] : null;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-kov-steel">Évolution du chiffre d&apos;affaires</p>
        {active && (
          <p className="text-kov-bone text-sm">
            {active.label} — <span className="text-kov-red">{formatEuros(active.cents)}</span>
          </p>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44" preserveAspectRatio="none" onMouseLeave={() => setHovered(null)}>
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--kov-red)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--kov-red)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#revenue-fill)" />
        <path d={linePath} fill="none" stroke="var(--kov-red)" strokeWidth={2} />
        {coords.map((c, i) => (
          <g key={i}>
            <rect x={c.x - width / points.length / 2} y={0} width={width / points.length} height={height} fill="transparent" onMouseEnter={() => setHovered(i)} />
            {hovered === i && <circle cx={c.x} cy={c.y} r={4} fill="var(--kov-red)" stroke="var(--kov-black)" strokeWidth={2} />}
          </g>
        ))}
      </svg>

      <div className="flex justify-between mt-2">
        {points.map((p, i) => (
          <span key={i} className="text-kov-steel text-[10px]">
            {p.label}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}
