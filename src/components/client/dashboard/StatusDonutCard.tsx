import { GlassCard } from "@/components/ui/GlassCard";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";

const STATUS_COLORS: Record<ProjectStatus, string> = {
  in_progress: "var(--kov-red)",
  in_review: "var(--kov-red-signal)",
  done: "var(--kov-bone)",
  on_hold: "var(--kov-steel)",
};

export function StatusDonutCard({ projects }: { projects: { status: string }[] }) {
  const total = projects.length;
  const counts = Object.fromEntries(
    PROJECT_STATUSES.map((s) => [s, projects.filter((p) => p.status === s).length])
  ) as Record<ProjectStatus, number>;

  const size = 104;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;
  const segments = PROJECT_STATUSES.filter((s) => counts[s] > 0).map((s) => {
    const arcLen = total > 0 ? (counts[s] / total) * circumference : 0;
    const seg = { status: s, arcLen, offset: cumulative };
    cumulative += arcLen;
    return seg;
  });

  return (
    <GlassCard className="p-6">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Statut global</p>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--kov-border)" strokeWidth={strokeWidth} />
            {segments.map((seg) => (
              <circle
                key={seg.status}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={STATUS_COLORS[seg.status]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.arcLen} ${circumference - seg.arcLen}`}
                strokeDashoffset={-seg.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-kov-bone text-2xl">{total}</span>
            <span className="text-kov-steel text-[10px] uppercase tracking-widest">Projets</span>
          </div>
        </div>
        <ul className="space-y-2 text-xs flex-1 min-w-0">
          {PROJECT_STATUSES.map((s) => (
            <li key={s} className="flex items-center gap-2 whitespace-nowrap">
              <span
                className="w-2 h-2 shrink-0"
                style={{ background: STATUS_COLORS[s], borderRadius: "var(--radius-pill)" }}
              />
              <span className="text-kov-steel">{PROJECT_STATUS_LABELS[s]}</span>
              <span className="text-kov-bone ml-auto pl-2">{counts[s]}</span>
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
}
