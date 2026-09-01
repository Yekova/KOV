import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { Avatar } from "@/components/admin/Avatar";

export type TeamMemberLoad = {
  id: string;
  name: string;
  title: string | null;
  openTaskCount: number;
};

// A relative workload indicator (busiest member = 100%, others scaled
// against them) — there is no hours/capacity data in this schema to
// compute a true utilization percentage. Documented first-pass heuristic,
// not a precision resource-management metric.
export function TeamWorkload({ members }: { members: TeamMemberLoad[] }) {
  const maxLoad = Math.max(...members.map((m) => m.openTaskCount), 1);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-kov-steel">Charge de travail de l&apos;équipe</p>
        <Link href="/admin/team" className="text-kov-red text-xs hover:underline">
          Voir tout
        </Link>
      </div>

      {members.length === 0 ? (
        <EmptyState message="Aucun membre d'équipe pour l'instant." />
      ) : (
        <ul className="space-y-4">
          {members.map((member) => {
            const relativePercent = Math.round((member.openTaskCount / maxLoad) * 100);
            return (
              <li key={member.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={member.name} />
                    <div className="min-w-0">
                      <p className="text-kov-bone text-sm truncate">{member.name}</p>
                      <p className="text-kov-steel text-xs truncate">{member.title || "Équipe KOV"}</p>
                    </div>
                  </div>
                  <span className="text-kov-steel text-xs shrink-0">{relativePercent}%</span>
                </div>
                <ProgressBar percent={relativePercent} />
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
