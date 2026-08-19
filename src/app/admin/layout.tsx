import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import type { AdminSearchItem } from "@/components/admin/GlobalAdminSearch";

const SEARCH_LIMIT = 200;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  const [
    { data: profile },
    { count: newLeadsBadge },
    { count: pendingTasksBadge },
    { count: newLeadsToday },
    { data: clientProfiles },
    { data: projectRows },
    { data: leadRows },
    { data: adminProfiles },
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("full_name, is_online").eq("id", user.id).maybeSingle(),
    supabaseAdmin.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabaseAdmin.from("project_tasks").select("id", { count: "exact", head: true }).in("status", ["todo", "blocked"]),
    supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabaseAdmin.from("profiles").select("id, full_name, email, company").eq("role", "client").limit(SEARCH_LIMIT),
    supabaseAdmin.from("projects").select("id, name, client_id").limit(SEARCH_LIMIT),
    supabaseAdmin.from("leads").select("id, name, company").order("created_at", { ascending: false }).limit(SEARCH_LIMIT),
    supabaseAdmin.from("profiles").select("id, full_name, email").eq("role", "admin").order("full_name"),
  ]);

  const clientNameById = new Map((clientProfiles ?? []).map((c) => [c.id, c.full_name || c.company || c.email]));

  const searchItems: AdminSearchItem[] = [
    ...(clientProfiles ?? []).map((c) => ({
      title: c.full_name || c.company || c.email,
      subtitle: c.email,
      category: "Clients" as const,
      href: `/admin/clients/${c.id}`,
    })),
    ...(projectRows ?? []).map((p) => ({
      title: p.name,
      subtitle: clientNameById.get(p.client_id) ?? undefined,
      category: "Projets" as const,
      href: `/admin/clients/${p.client_id}`,
    })),
    ...(leadRows ?? []).map((l) => ({
      title: l.name,
      subtitle: l.company ?? undefined,
      category: "Leads" as const,
      href: `/admin/leads`,
    })),
  ];

  const clientOptions = (clientProfiles ?? []).map((c) => ({
    id: c.id,
    label: c.full_name || c.company || c.email,
  }));
  const projectOptions = (projectRows ?? []).map((p) => ({
    id: p.id,
    label: `${p.name} — ${clientNameById.get(p.client_id) ?? "?"}`,
  }));
  const adminOptions = (adminProfiles ?? []).map((a) => ({
    id: a.id,
    label: a.full_name || a.email,
  }));

  return (
    <div className="min-h-screen flex" style={{ background: "var(--kov-black)" }}>
      <AdminSidebar badgeCounts={{ leads: newLeadsBadge ?? 0, tasks: pendingTasksBadge ?? 0 }} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar
          searchItems={searchItems}
          clients={clientOptions}
          projects={projectOptions}
          admins={adminOptions}
          newLeadsCount={newLeadsToday ?? 0}
          fullName={profile?.full_name ?? null}
          roleLabel="Administrateur"
          isOnline={profile?.is_online ?? false}
        />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
