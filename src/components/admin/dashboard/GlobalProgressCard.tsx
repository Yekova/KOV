import { GlassCard } from "@/components/ui/GlassCard";

export function GlobalProgressCard({
  percent,
  projectsThisMonth,
  doneCount,
  overdueCount,
}: {
  percent: number;
  projectsThisMonth: number;
  doneCount: number;
  overdueCount: number;
}) {
  const size = 96;
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLen = (percent / 100) * circumference;

  return (
    <GlassCard className="p-5">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Taux d&apos;avancement global</p>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--kov-border)" strokeWidth={strokeWidth} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--kov-red)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLen} ${circumference - arcLen}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-kov-bone text-xl">{percent}%</span>
          </div>
        </div>
        <ul className="space-y-1.5 text-xs flex-1 min-w-0">
          <li className="flex items-center justify-between gap-2">
            <span className="text-kov-steel">Projets ce mois</span>
            <span className="text-kov-bone">{projectsThisMonth}</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-kov-steel">Terminés</span>
            <span className="text-kov-bone">{doneCount}</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-kov-steel">En retard</span>
            <span style={{ color: overdueCount > 0 ? "var(--kov-red)" : "var(--kov-bone)" }}>{overdueCount}</span>
          </li>
        </ul>
      </div>
    </GlassCard>
  );
}
