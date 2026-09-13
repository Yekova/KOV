"use client";

import { motion } from "framer-motion";

interface ChartProps {
  reducedMotion: boolean;
  /** True while this chart's card is the coverflow's active one. Used only
   * to force a remount (via `key` below) so the entrance animation replays
   * each time the visitor scrolls this card into focus, instead of playing
   * once on mount and then sitting inert off in the periphery for the rest
   * of the scroll. */
  active: boolean;
}

// Small, self-contained SVG visualizations — illustrative/conceptual
// (shape, motion, relative fill), not dashboards reporting a specific
// audited statistic. Printing a precise invented percentage or score here
// would read as a real, checkable claim about KOV's own work, which isn't
// something to fabricate — these mirror the same honest framing the rest
// of the site already uses. Each replays its entrance animation every time
// its card becomes the coverflow's active one (see `active` above).

const RADAR_LABELS = ["Design", "UX", "Motion", "Marque", "Détail"];

function radarPoint(index: number, radius: number, center: number) {
  const angle = (Math.PI * 2 * index) / RADAR_LABELS.length - Math.PI / 2;
  return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)] as const;
}

export function RadarChart({ reducedMotion, active }: ChartProps) {
  const size = 130;
  const center = size / 2;
  const maxRadius = 46;
  // Slightly irregular on purpose — a perfect regular pentagon reads as a
  // placeholder shape; these proportions suggest an actual (if stylized)
  // shape of emphasis across the five axes.
  const radii = [0.95, 0.8, 0.9, 0.7, 0.85].map((r) => r * maxRadius);
  const points = radii.map((r, i) => radarPoint(i, r, center));
  const polygon = points.map(([x, y]) => `${x},${y}`).join(" ");
  const rings = [0.33, 0.66, 1];

  return (
    <div className="flex flex-col items-center gap-3">
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
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2} fill="var(--kov-steel)" />
        ))}
        <motion.polygon
          key={active ? "in" : "out"}
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
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 max-w-[140px]">
        {RADAR_LABELS.map((label) => (
          <span key={label} className="text-kov-steel text-[9px] uppercase tracking-widest">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// A growth trend, not three independent metrics — monotonically
// increasing bar heights read as "things get better over time", the
// shape "Des résultats concrets" is actually claiming, without attaching
// a specific invented number to any one bar.
const GROWTH_BAR_HEIGHTS = [0.32, 0.48, 0.62, 0.8, 1];
const GROWTH_BAR_LABELS = ["S1", "S2", "S3", "S4", "S5"];

export function GrowthBars({ reducedMotion, active }: ChartProps) {
  const barWidth = 16;
  const gap = 10;
  const trackHeight = 92;
  const width = GROWTH_BAR_HEIGHTS.length * (barWidth + gap);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={width} height={trackHeight + 8} aria-hidden="true">
        {GROWTH_BAR_HEIGHTS.map((fill, i) => {
          const x = i * (barWidth + gap);
          const h = trackHeight * fill;
          return (
            <g key={i}>
              <rect x={x} y={0} width={barWidth} height={trackHeight} rx={3} fill="var(--glass-border)" opacity={0.4} />
              <motion.rect
                key={active ? "in" : "out"}
                x={x}
                width={barWidth}
                height={h}
                rx={3}
                fill={i === GROWTH_BAR_HEIGHTS.length - 1 ? "var(--kov-red)" : "rgba(227,30,36,0.55)"}
                initial={reducedMotion ? undefined : { y: trackHeight, height: 0 }}
                animate={{ y: trackHeight - h, height: h }}
                transition={{ duration: 0.5, delay: reducedMotion ? 0 : i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between" style={{ width }}>
        {GROWTH_BAR_LABELS.map((label) => (
          <span key={label} className="text-kov-steel text-[9px] uppercase tracking-widest" style={{ width: barWidth }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// A completing ring, not a printed score — the ring fills all the way as
// an illustration of thoroughness, with a qualitative word once it
// settles instead of an invented number.
export function PerformanceGauge({ reducedMotion, active }: ChartProps) {
  const size = 118;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--glass-border)" strokeWidth={strokeWidth} />
        <motion.circle
          key={active ? "in" : "out"}
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
        <motion.span
          key={active ? "in-label" : "out-label"}
          className="text-kov-bone text-[10px] uppercase tracking-widest"
          initial={reducedMotion ? undefined : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: reducedMotion ? 0 : 0.6 }}
        >
          Optimisé
        </motion.span>
      </div>
    </div>
  );
}

// A layered stack, foundation widest and reddest, narrowing and lightening
// going up — "on ne construit rien de bien sans une base solide" as a
// shape, not a stock photo of a mountain. Builds bottom-up (the actual
// building order) rather than top-down.
const FOUNDATION_LAYERS = [
  { width: 128, color: "var(--kov-red)" },
  { width: 100, color: "rgba(227,30,36,0.55)" },
  { width: 74, color: "var(--kov-steel)" },
  { width: 50, color: "var(--glass-border)" },
];
const FOUNDATION_BAR_HEIGHT = 16;
const FOUNDATION_GAP = 8;

export function FoundationStack({ reducedMotion, active }: ChartProps) {
  const width = 150;
  const baseline = 100;

  return (
    <svg width={width} height={112} viewBox={`0 0 ${width} 112`} aria-hidden="true">
      {FOUNDATION_LAYERS.map((layer, i) => {
        const y = baseline - (i + 1) * FOUNDATION_BAR_HEIGHT - i * FOUNDATION_GAP;
        const x = (width - layer.width) / 2;
        return (
          <motion.rect
            key={active ? `in-${i}` : `out-${i}`}
            x={x}
            width={layer.width}
            height={FOUNDATION_BAR_HEIGHT}
            rx={4}
            fill={layer.color}
            initial={reducedMotion ? undefined : { y: y + 14, opacity: 0 }}
            animate={{ y, opacity: 1 }}
            transition={{ duration: 0.45, delay: reducedMotion ? 0 : i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
    </svg>
  );
}

// Three real device silhouettes (mobile/tablette/desktop), not a screen
// recording of one — pure frames, each with a couple of content-line
// abstractions inside, revealing smallest-to-largest to read as "adapts
// to every size" rather than a fixed dashboard shot.
const DEVICE_FRAMES = [
  { label: "Mobile", x: 8, y: 26, w: 34, h: 70, rx: 7 },
  { label: "Tablette", x: 52, y: 34, w: 50, h: 62, rx: 8 },
  { label: "Desktop", x: 112, y: 50, w: 64, h: 46, rx: 5 },
];

export function DeviceFrames({ reducedMotion, active }: ChartProps) {
  const width = 184;
  const height = 110;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {DEVICE_FRAMES.map((frame, i) => (
          <motion.g
            key={active ? `in-${i}` : `out-${i}`}
            initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: reducedMotion ? 0 : i * 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} rx={frame.rx} fill="none" stroke="var(--kov-steel)" strokeWidth={1.5} />
            <line
              x1={frame.x + frame.w * 0.22}
              x2={frame.x + frame.w * 0.78}
              y1={frame.y + frame.h * 0.35}
              y2={frame.y + frame.h * 0.35}
              stroke="var(--kov-red)"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1={frame.x + frame.w * 0.22}
              x2={frame.x + frame.w * 0.6}
              y1={frame.y + frame.h * 0.5}
              y2={frame.y + frame.h * 0.5}
              stroke="var(--kov-red)"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.5}
            />
          </motion.g>
        ))}
      </svg>
      <div className="flex justify-between" style={{ width }}>
        {DEVICE_FRAMES.map((frame) => (
          <span key={frame.label} className="text-kov-steel text-[9px] uppercase tracking-widest">
            {frame.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// A guided path, not a photo of two people — a progression of real
// waypoints (idée → étapes → résultat) with the line drawing itself in
// and each node lighting up as it's reached, the last one (the result)
// held slightly larger. Matches "à vos côtés, de l'idée aux résultats"
// as a shape rather than depicting people that would have to be stock
// photography.
const JOURNEY_NODES: [number, number][] = [
  [16, 88],
  [54, 58],
  [98, 70],
  [138, 24],
];
const JOURNEY_PATH = JOURNEY_NODES.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");

export function JourneyPath({ reducedMotion, active }: ChartProps) {
  return (
    <svg width={154} height={104} viewBox="0 0 154 104" aria-hidden="true">
      <motion.path
        key={active ? "line-in" : "line-out"}
        d={JOURNEY_PATH}
        fill="none"
        stroke="var(--kov-red)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reducedMotion ? undefined : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      {JOURNEY_NODES.map(([x, y], i) => {
        const isLast = i === JOURNEY_NODES.length - 1;
        return (
          <motion.circle
            key={active ? `node-in-${i}` : `node-out-${i}`}
            cx={x}
            cy={y}
            r={isLast ? 6 : 4}
            fill={isLast ? "var(--kov-red)" : "var(--kov-bone)"}
            stroke={isLast ? "none" : "var(--kov-red)"}
            strokeWidth={isLast ? 0 : 1.5}
            initial={reducedMotion ? undefined : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: reducedMotion ? 0 : 0.15 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        );
      })}
    </svg>
  );
}
