import { GlassCard } from "@/components/ui/GlassCard";

export type DonutSegment = { key: string; label: string; value: number; color: string };

export function Donut({
  title,
  segments,
  centerLabel,
  formatValue = (v) => String(v),
}: {
  title: string;
  segments: DonutSegment[];
  centerLabel: string;
  formatValue?: (value: number) => string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const size = 104;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs = segments
    .filter((s) => s.value > 0)
    .reduce<{ segment: DonutSegment; arcLen: number; offset: number }[]>((acc, segment) => {
      const arcLen = total > 0 ? (segment.value / total) * circumference : 0;
      const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].arcLen : 0;
      return [...acc, { segment, arcLen, offset }];
    }, []);

  return (
    <GlassCard className="p-6">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">{title}</p>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--kov-border)" strokeWidth={strokeWidth} />
            {arcs.map(({ segment, arcLen, offset }) => (
              <circle
                key={segment.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${arcLen} ${circumference - arcLen}`}
                strokeDashoffset={-offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-kov-bone text-xl">{formatValue(total)}</span>
            <span className="text-kov-steel text-[10px] uppercase tracking-widest">{centerLabel}</span>
          </div>
        </div>
        <ul className="space-y-2 text-xs flex-1 min-w-0">
          {segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <li key={s.key} className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-2 h-2 shrink-0" style={{ background: s.color, borderRadius: "var(--radius-pill)" }} />
                <span className="text-kov-steel truncate">{s.label}</span>
                <span className="text-kov-bone ml-auto pl-2">{formatValue(s.value)}</span>
                <span className="text-kov-steel">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
              </li>
            ))}
        </ul>
      </div>
    </GlassCard>
  );
}
