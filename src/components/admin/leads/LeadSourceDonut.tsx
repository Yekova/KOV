import { GlassCard } from "@/components/ui/GlassCard";
import { LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_SOURCE_COLORS } from "@/lib/admin/status";

export function LeadSourceDonut({ counts, total }: { counts: Record<string, number>; total: number }) {
  const size = 104;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const sources = LEAD_SOURCES.filter((s) => (counts[s] ?? 0) > 0);

  const segments = sources.reduce<{ source: (typeof LEAD_SOURCES)[number]; arcLen: number; offset: number }[]>((acc, source) => {
    const count = counts[source] ?? 0;
    const arcLen = total > 0 ? (count / total) * circumference : 0;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].arcLen : 0;
    return [...acc, { source, arcLen, offset }];
  }, []);

  return (
    <GlassCard className="p-6">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Répartition par source</p>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--kov-border)" strokeWidth={strokeWidth} />
            {segments.map((seg) => (
              <circle
                key={seg.source}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={LEAD_SOURCE_COLORS[seg.source]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.arcLen} ${circumference - seg.arcLen}`}
                strokeDashoffset={-seg.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-kov-bone text-2xl">{total}</span>
            <span className="text-kov-steel text-[10px] uppercase tracking-widest">Leads</span>
          </div>
        </div>
        <ul className="space-y-2 text-xs flex-1 min-w-0">
          {LEAD_SOURCES.map((source) => {
            const count = counts[source] ?? 0;
            if (count === 0) return null;
            return (
              <li key={source} className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-2 h-2 shrink-0" style={{ background: LEAD_SOURCE_COLORS[source], borderRadius: "var(--radius-pill)" }} />
                <span className="text-kov-steel">{LEAD_SOURCE_LABELS[source]}</span>
                <span className="text-kov-bone ml-auto pl-2">{count}</span>
                <span className="text-kov-steel">{total > 0 ? Math.round((count / total) * 100) : 0}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </GlassCard>
  );
}
