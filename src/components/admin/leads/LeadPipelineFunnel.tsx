import { GlassCard } from "@/components/ui/GlassCard";
import { LEAD_PIPELINE_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/admin/status";

// A real converging funnel (SVG trapezoids, one per pipeline stage) built
// from the current count of leads sitting at each status — not a
// cumulative retention funnel (there's no stage-history log to compute
// that from honestly), just each stage's live count, tapered visually
// stage-to-stage so the drop-off still reads at a glance.
export function LeadPipelineFunnel({ counts }: { counts: Record<string, number> }) {
  const stages = LEAD_PIPELINE_STATUSES.map((status) => ({ status, count: counts[status] ?? 0 }));
  const maxCount = Math.max(1, ...stages.map((s) => s.count));
  const topCount = stages[0]?.count || maxCount;

  const segHeight = 100 / stages.length;
  const widths = stages.map((s) => (s.count / maxCount) * 90 + 6); // 6..96, never fully collapses to zero

  return (
    <GlassCard className="p-6">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Pipeline des leads</p>

      <div className="grid grid-cols-6 gap-2 mb-3 text-center">
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
          return (
            <polygon
              key={s.status}
              points={points}
              fill={LEAD_STATUS_COLORS[s.status]}
              opacity={0.85}
              stroke="var(--kov-black)"
              strokeWidth={0.5}
            />
          );
        })}
      </svg>

      <div className="grid grid-cols-6 gap-2 mt-3 text-center">
        {stages.map((s) => (
          <div key={s.status} className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 shrink-0" style={{ background: LEAD_STATUS_COLORS[s.status], borderRadius: "var(--radius-pill)" }} />
            <span className="text-kov-steel text-[10px] uppercase tracking-widest truncate">{LEAD_STATUS_LABELS[s.status]}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
