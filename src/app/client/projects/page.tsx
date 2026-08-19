import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";

export const metadata: Metadata = {
  title: "Mes projets — KOV",
};

export default async function ClientProjectsPage() {
  const user = await requireUser();

  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, name, category, status, progress_percent, next_deadline_date, deadline_phase_label")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const rows = projects ?? [];

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Mes projets</h1>

      {rows.length === 0 ? (
        <GlassCard className="p-8">
          <p className="text-kov-steel text-sm">Aucun projet pour l&apos;instant.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {rows.map((p) => (
            <GlassCard key={p.id} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-kov-bone text-lg">{p.name}</p>
                  <p className="text-kov-steel text-xs uppercase tracking-widest mt-1">{p.category}</p>
                </div>
                <span className="text-kov-red text-xs uppercase tracking-widest">
                  {PROJECT_STATUS_LABELS[p.status as ProjectStatus] ?? p.status}
                </span>
              </div>

              <div className="h-1.5 w-full overflow-hidden mb-2" style={{ background: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}>
                <div className="h-full" style={{ width: `${p.progress_percent}%`, background: "var(--kov-red)" }} />
              </div>
              <p className="text-kov-steel text-xs mb-3">{p.progress_percent}% complété</p>

              {p.next_deadline_date && (
                <p className="text-kov-steel text-xs">
                  Prochaine échéance :{" "}
                  <span className="text-kov-bone">
                    {new Date(`${p.next_deadline_date}T00:00:00`).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  {p.deadline_phase_label ? ` — ${p.deadline_phase_label}` : ""}
                </p>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </main>
  );
}
