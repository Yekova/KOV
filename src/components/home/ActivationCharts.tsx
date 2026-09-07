"use client";

import { motion } from "framer-motion";

interface ChartProps {
  reducedMotion: boolean;
}

// Four small, self-contained SVG visualizations — illustrative/conceptual
// (shape, motion, relative fill), not dashboards reporting a specific
// audited statistic. Printing a precise invented percentage here (e.g. a
// bare "98%") would read as a real, checkable claim about KOV's own work,
// which isn't something to fabricate — these mirror the same honest
// framing the rest of the site already uses. Each self-animates on mount
// via framer-motion (they're only ever mounted once the activated state
// is showing), no external trigger prop needed.

const RADAR_LABELS = ["Design", "UX", "Motion", "Marque", "Détail"];

function radarPoint(index: number, radius: number, center: number) {
  const angle = (Math.PI * 2 * index) / RADAR_LABELS.length - Math.PI / 2;
  return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)] as const;
}

export function RadarChart({ reducedMotion }: ChartProps) {
  const size = 120;
  const center = size / 2;
  const maxRadius = 44;
  // Slightly irregular on purpose — a perfect regular pentagon reads as a
  // placeholder shape; these proportions suggest an actual (if stylized)
  // shape of emphasis across the five axes.
  const radii = [0.95, 0.8, 0.9, 0.7, 0.85].map((r) => r * maxRadius);
  const points = radii.map((r, i) => radarPoint(i, r, center));
  const polygon = points.map(([x, y]) => `${x},${y}`).join(" ");
  const rings = [0.33, 0.66, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {rings.map((r) => (
        <polygon
          key={r}
          points={RADAR_LABELS.map((_, i) => radarPoint(i, r * maxRadius, center).join(",")).join(" ")}
          fill="none"
          stroke="var(--glass-border)"
          strokeWidth={1}
        />
      ))}
      {RADAR_LABELS.map((_, i) => {
        const [x, y] = radarPoint(i, maxRadius, center);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="var(--glass-border)" strokeWidth={1} />;
      })}
      <motion.polygon
        points={polygon}
        fill="rgba(227,30,36,0.25)"
        stroke="var(--kov-red)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        initial={reducedMotion ? undefined : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${center}px ${center}px` }}
      />
    </svg>
  );
}

const PERFORMANCE_BARS = [
  { label: "Vitesse", fill: 0.92 },
  { label: "SEO", fill: 0.85 },
  { label: "Conversion", fill: 0.78 },
];

export function PerformanceBars({ reducedMotion }: ChartProps) {
  const barWidth = 22;
  const gap = 14;
  const trackHeight = 88;
  return (
    <svg width={PERFORMANCE_BARS.length * (barWidth + gap)} height={trackHeight + 20} aria-hidden="true">
      {PERFORMANCE_BARS.map((bar, i) => {
        const x = i * (barWidth + gap);
        const h = trackHeight * bar.fill;
        return (
          <g key={bar.label}>
            <rect x={x} y={0} width={barWidth} height={trackHeight} rx={4} fill="var(--glass-border)" opacity={0.4} />
            <motion.rect
              x={x}
              width={barWidth}
              height={h}
              rx={4}
              fill="var(--kov-red)"
              initial={reducedMotion ? undefined : { y: trackHeight, height: 0 }}
              animate={{ y: trackHeight - h, height: h }}
              transition={{ duration: 0.6, delay: reducedMotion ? 0 : i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            />
          </g>
        );
      })}
    </svg>
  );
}

const RESPONSIVE_BARS = ["Mobile", "Tablette", "Desktop"];

export function ResponsiveBars({ reducedMotion }: ChartProps) {
  const trackWidth = 120;
  const barHeight = 10;
  const gap = 14;
  return (
    <svg width={trackWidth} height={RESPONSIVE_BARS.length * (barHeight + gap)} aria-hidden="true">
      {RESPONSIVE_BARS.map((label, i) => {
        const y = i * (barHeight + gap);
        return (
          <g key={label}>
            <rect x={0} y={y} width={trackWidth} height={barHeight} rx={barHeight / 2} fill="var(--glass-border)" opacity={0.4} />
            <motion.rect
              y={y}
              height={barHeight}
              rx={barHeight / 2}
              fill="var(--kov-red)"
              initial={reducedMotion ? undefined : { width: 0 }}
              animate={{ width: trackWidth }}
              transition={{ duration: 0.5, delay: reducedMotion ? 0 : i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function SecurityGauge({ reducedMotion }: ChartProps) {
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--glass-border)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--kov-red)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reducedMotion ? undefined : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--kov-bone)"
          strokeWidth="2"
          initial={reducedMotion ? undefined : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: reducedMotion ? 0 : 0.6 }}
        >
          <path d="M5 13l4 4L19 7" />
        </motion.svg>
      </div>
    </div>
  );
}
