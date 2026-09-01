import { GlassCard } from "@/components/ui/GlassCard";
import type { LeadStatusRow } from "@/lib/leads/statuses";

// A real converging funnel (SVG trapezoids, one per pipeline stage) built
// from the current count of leads sitting at each status — not a
// cumulative retention funnel (there's no stage-history log to compute
// that from honestly), just each stage's live count, tapered visually
// stage-to-stage so the drop-off still reads at a glance. Stages come from
// the admin-configurable lead_statuses table (position order), excluding
// `lost` — a terminal exit reachable from any stage, not a step along the
// pipeline — same as the previous hardcoded LEAD_PIPELINE_STATUSES did.
export function LeadPipelineFunnel({ counts, statuses }: { counts: Record<string, number>; statuses: LeadStatusRow[] }) {
  const stages = statuses
    .filter((s) => s.isActive && !s.isLost)
    .sort((a, b) => a.position - b.position)
    .map((s) => ({ status: s.key, label: s.label, color: s.color, count: counts[s.key] ?? 0 }));

  const maxCount = Math.max(1, ...stages.map((s) => s.count));
  const topCount = stages[0]?.count || maxCount;

  const segHeight = stages.length > 0 ? 100 / stages.length : 0;
  const widths = stages.map((s) => (s.count / maxCount) * 90 + 6); // 6..96, never fully collapses to zero

  if (stages.length === 0) return null;

  return (
    <GlassCard className="p-6">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Pipeline des leads</p>

      <div className="grid gap-2 mb-3 text-center" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
        {stages.map((s) => (
          <div key={s.status}>
            <p className="text-kov-bone font-display text-lg">{s.count}</p>
            <p className="text-kov-steel text-[10px] mt-0.5">{topCount > 0 ? Math.round((s.count / topCount) * 100) : 0}%</p>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 100 100" className="w-full h-40" preserveAspectRatio="none">
        {stages.map((s, i) => {
          const yTop = i * segHeight;
          const yBottom = (i + 1) * segHeight;
          const topHalf = widths[i] / 2;
          const bottomHalf = (widths[i + 1] ?? widths[i]) / 2;
          const points = [
            [50 - topHalf, yTop],
            [50 + topHalf, yTop],
            [50 + bottomHalf, yBottom],
            [50 - bottomHalf, yBottom],
          ]
            .map(([x, y]) => `${x},${y}`)
            .join(" ");
          return <polygon key={s.status} points={points} fill={s.color} opacity={0.85} stroke="var(--kov-black)" strokeWidth={0.5} />;
        })}
      </svg>

      <div className="grid gap-2 mt-3 text-center" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
        {stages.map((s) => (
          <div key={s.status} className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 shrink-0" style={{ background: s.color, borderRadius: "var(--radius-pill)" }} />
            <span className="text-kov-steel text-[10px] uppercase tracking-widest truncate">{s.label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
