import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/admin/EmptyState";
import { inviteAdmin } from "./actions";

export const metadata: Metadata = { title: "Équipe — Admin KOV" };

const FIELD_CLASS =
  "bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export default async function AdminTeamPage() {
  await requireAdmin();

  const [{ data: adminProfiles }, { data: openTasks }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, full_name, email, display_title, is_online, created_at").eq("role", "admin").order("created_at"),
    supabaseAdmin.from("project_tasks").select("assigned_to").in("status", ["todo", "in_progress", "blocked"]),
  ]);

  const rows = adminProfiles ?? [];
  const openTaskCountByAdmin = new Map<string, number>();
  for (const t of openTasks ?? []) {
    if (!t.assigned_to) continue;
    openTaskCountByAdmin.set(t.assigned_to, (openTaskCountByAdmin.get(t.assigned_to) ?? 0) + 1);
  }

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto w-full space-y-10">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Équipe</h1>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Membres</h2>
        {rows.length === 0 ? (
          <EmptyState message="Aucun membre d'équipe pour l'instant." />
        ) : (
          <div className="space-y-2">
            {rows.map((admin) => (
              <div
                key={admin.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b py-3"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: admin.is_online ? "#4ade80" : "var(--kov-steel)" }}
                    title={admin.is_online ? "En ligne" : "Hors ligne"}
                  />
                  <div className="min-w-0">
                    <p className="text-kov-bone text-sm">{admin.full_name || admin.email}</p>
                    <p className="text-kov-steel text-xs mt-0.5">{admin.display_title || "Équipe KOV"} — {admin.email}</p>
                  </div>
                </div>
                <span className="text-kov-steel text-xs uppercase tracking-widest whitespace-nowrap">
                  {openTaskCountByAdmin.get(admin.id) ?? 0} tâche{(openTaskCountByAdmin.get(admin.id) ?? 0) > 1 ? "s" : ""} en cours
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Inviter un membre</h2>
        <form
          action={inviteAdmin}
          className="border p-4 flex flex-wrap items-end gap-4"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
        >
          <label className="text-xs text-kov-steel">
            Email
            <input type="email" name="email" required placeholder="prenom@kov-agency.site" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <label className="text-xs text-kov-steel">
            Nom (facultatif)
            <input type="text" name="full_name" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <label className="text-xs text-kov-steel">
            Titre (facultatif)
            <input type="text" name="display_title" placeholder="Chef de projet" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <Button type="submit" variant="primary">
            Envoyer l&apos;invitation
          </Button>
        </form>
        <p className="text-kov-steel text-xs mt-3">
          Un email est envoyé avec un lien à usage unique pour créer le mot de passe et accéder à l&apos;espace admin.
        </p>
      </section>
    </main>
  );
}
