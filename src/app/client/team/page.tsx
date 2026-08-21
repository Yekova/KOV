import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { getPublicAssetUrl } from "@/lib/portal/storage";

export const metadata: Metadata = {
  title: "Équipe KOV — KOV",
};

export default async function ClientTeamPage() {
  const user = await requireUser();

  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabaseAdmin.from("profiles").select("account_manager_id").eq("id", user.id).maybeSingle(),
    supabaseAdmin.from("projects").select("id, name, project_manager_id").eq("client_id", user.id),
  ]);

  const projectRows = projects ?? [];

  const projectNamesByManagerId = new Map<string, string[]>();
  for (const p of projectRows) {
    if (!p.project_manager_id) continue;
    const names = projectNamesByManagerId.get(p.project_manager_id) ?? [];
    names.push(p.name);
    projectNamesByManagerId.set(p.project_manager_id, names);
  }

  const managerIds = Array.from(
    new Set([profile?.account_manager_id, ...projectRows.map((p) => p.project_manager_id)].filter((id): id is string => !!id))
  );

  const { data: managers } = managerIds.length
    ? await supabaseAdmin.from("profiles").select("id, full_name, display_title, avatar_path, is_online").in("id", managerIds)
    : { data: [] as { id: string; full_name: string | null; display_title: string | null; avatar_path: string | null; is_online: boolean }[] };

  const team = (managers ?? []).map((m) => ({
    ...m,
    isAccountManager: m.id === profile?.account_manager_id,
    projects: projectNamesByManagerId.get(m.id) ?? [],
  }));

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Équipe KOV</h1>

      {team.length === 0 ? (
        <GlassCard className="p-8">
          <p className="text-kov-bone text-sm mb-2">
            Aucun membre assigné pour l&apos;instant<span className="text-kov-red">.</span>
          </p>
          <p className="text-kov-steel text-sm">
            Votre chef de projet sera visible ici dès qu&apos;il vous sera assigné.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {team.map((member) => {
            const avatarUrl = getPublicAssetUrl(member.avatar_path);
            return (
              <GlassCard key={member.id} className="p-6">
                <div className="flex items-center gap-4">
                  <span
                    className="w-14 h-14 shrink-0 overflow-hidden flex items-center justify-center text-kov-bone text-lg"
                    style={{ borderRadius: "var(--radius-pill)", background: "var(--kov-graphite)" }}
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (member.full_name || "K").charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-kov-bone text-sm flex items-center gap-2">
                      <span className="truncate">{member.full_name || "—"}</span>
                      <span
                        className="w-1.5 h-1.5 shrink-0"
                        style={{
                          background: member.is_online ? "var(--kov-red)" : "var(--kov-steel)",
                          borderRadius: "var(--radius-pill)",
                        }}
                      />
                    </p>
                    <p className="text-kov-steel text-xs mt-0.5">{member.display_title || "Équipe KOV"}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2" style={{ borderColor: "var(--kov-border)" }}>
                  {member.isAccountManager && (
                    <span
                      className="text-[10px] uppercase tracking-widest text-kov-red px-2 py-1"
                      style={{ background: "rgba(220,38,38,0.1)", borderRadius: "var(--radius-sm)" }}
                    >
                      Chef de projet
                    </span>
                  )}
                  {member.projects.map((name) => (
                    <span
                      key={name}
                      className="text-[10px] uppercase tracking-widest text-kov-steel px-2 py-1"
                      style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </main>
  );
}
