import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function getWeekDays(centerDate: Date): Date[] {
  const day = centerDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(centerDate);
  monday.setDate(centerDate.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type DeadlineProject = {
  name: string;
  next_deadline_date: string;
  deadline_phase_label: string | null;
};

export function NextDeadlineCard({ project, today }: { project: DeadlineProject | null; today: Date }) {
  const deadlineDate = project ? new Date(`${project.next_deadline_date}T00:00:00`) : today;
  const week = getWeekDays(deadlineDate);

  return (
    <GlassCard className="p-6 flex flex-col">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Prochaine échéance</p>

      {project ? (
        <>
          <p className="text-kov-red text-xs uppercase tracking-widest mb-1">
            {deadlineDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-kov-bone text-sm mb-1">{project.name}</p>
          <p className="text-kov-steel text-xs mb-4">{project.deadline_phase_label || "—"}</p>
        </>
      ) : (
        <p className="text-kov-steel text-sm mb-4">Aucune échéance prévue pour l&apos;instant.</p>
      )}

      <div className="flex justify-between mb-6">
        {week.map((d, i) => {
          const isDeadline = project ? isSameDay(d, deadlineDate) : false;
          const isToday = isSameDay(d, today);
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 text-xs">
              <span className="text-kov-steel">{DAY_LABELS[i]}</span>
              <span
                className="w-7 h-7 flex items-center justify-center"
                style={{
                  borderRadius: "var(--radius-pill)",
                  background: isDeadline ? "var(--kov-red)" : "transparent",
                  border: isToday && !isDeadline ? "1px solid var(--kov-bone)" : "1px solid transparent",
                  color: isDeadline ? "var(--kov-white)" : "var(--kov-bone)",
                }}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <Button href="/client/projects" variant="secondary" className="w-full justify-center mt-auto">
        Voir le planning
      </Button>
    </GlassCard>
  );
}
