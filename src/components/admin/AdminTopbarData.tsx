import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { AdminTopbar } from "./AdminTopbar";
import type { AdminSearchItem } from "./GlobalAdminSearch";

const SEARCH_LIMIT = 200;

// Isolated in its own Suspense boundary (see admin/layout.tsx) — this is the
// heaviest part of the admin shell (9 queries for the search index and
// picker options), so it must never block route transitions or the sidebar.
export async function AdminTopbarData({ userId }: { userId: string }) {
  // Server Component executed once per request, not re-rendered client-side —
  // "now" for a "last 24h" query is legitimately request-time data, not impure
  // render output.
  // eslint-disable-next-line react-hooks/purity
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: profile },
    { count: newLeadsToday },
    { data: clientProfiles },
    { data: projectRows },
    { data: leadRows },
    { data: adminProfiles },
    { data: quoteRows },
    { data: invoiceRows },
    { data: documentRows },
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("full_name, is_online").eq("id", userId).maybeSingle(),
    supabaseAdmin.from("leads").select("id", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    supabaseAdmin.from("profiles").select("id, full_name, email, company").eq("role", "client").limit(SEARCH_LIMIT),
    supabaseAdmin.from("projects").select("id, name, client_id").limit(SEARCH_LIMIT),
    supabaseAdmin.from("leads").select("id, name, company").order("created_at", { ascending: false }).limit(SEARCH_LIMIT),
    supabaseAdmin.from("profiles").select("id, full_name, email").eq("role", "admin").order("full_name"),
    supabaseAdmin.from("quotes").select("id, reference, recipient_name").order("created_at", { ascending: false }).limit(SEARCH_LIMIT),
    supabaseAdmin
      .from("invoices")
      .select("id, reference, client_id")
      .order("issued_at", { ascending: false })
      .limit(SEARCH_LIMIT),
    supabaseAdmin
      .from("documents")
      .select("id, filename, project_id")
      .order("created_at", { ascending: false })
      .limit(SEARCH_LIMIT),
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
      href: `/admin/projects/${p.id}`,
    })),
    ...(leadRows ?? []).map((l) => ({
      title: l.name,
      subtitle: l.company ?? undefined,
      category: "Leads" as const,
      href: `/admin/leads`,
    })),
    ...(quoteRows ?? []).map((q) => ({
      title: q.reference,
      subtitle: q.recipient_name,
      category: "Devis" as const,
      href: `/admin/quotes`,
    })),
    ...(invoiceRows ?? []).map((i) => ({
      title: i.reference,
      subtitle: clientNameById.get(i.client_id) ?? undefined,
      category: "Factures" as const,
      href: `/admin/clients/${i.client_id}`,
    })),
    ...(documentRows ?? []).map((d) => ({
      title: d.filename,
      category: "Documents" as const,
      href: d.project_id ? `/admin/projects/${d.project_id}` : `/admin/clients`,
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
  );
}
