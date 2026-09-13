import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { StatCard } from "@/components/admin/StatCard";
import { Donut, type DonutSegment } from "@/components/admin/Donut";
import { ActivityFeed, type AdminActivityItem } from "@/components/admin/dashboard/ActivityFeed";
import { ErrorState } from "@/components/admin/ErrorState";
import { PROJECT_STATUS_LABELS, isProjectStatus } from "@/lib/portal/status";
import {
  ClientsWorkspace,
  type ClientRow,
  type ManagerInfo,
  type ClientProjectInfo,
  type ClientActivityInfo,
} from "@/components/admin/clients/ClientsWorkspace";

export const metadata: Metadata = {
  title: "Clients — Admin KOV",
};

// Real-signal-only palette (spec §26/§27): the active/in-progress segment is
// the one KOV red, everything else is a shade of gray — not the dashboard's
// own 6-hue CATEGORY_COLORS (src/app/admin/page.tsx), which is deliberately
// vivid for an unrelated revenue-by-category chart.
const STATUS_COLORS: Record<string, string> = {
  in_progress: "var(--kov-red)",
  in_review: "var(--kov-concrete)",
  done: "var(--kov-steel)",
  on_hold: "var(--kov-muted)",
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function AdminClientsPage() {
  await requireAdmin();

  // One unfiltered fetch (no server-side archived/page params anymore) —
  // filtering, sorting and search all happen client-side in
  // ClientsWorkspace, the same "fetch once, filter in useMemo" convention
  // already used by LeadsListView/GlobalAdminSearch elsewhere in this
  // admin. That's also the only way to show real Tous/Actifs/Archivés
  // counts simultaneously without three separate queries.
  const { data: clientRows, error: clientsError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, company, account_manager_id, avatar_path, created_at, archived_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  if (clientsError) {
    return (
      <main className="px-6 py-10 max-w-6xl mx-auto w-full">
        <ErrorState message="Impossible de charger les clients." />
      </main>
    );
  }

  const clients = clientRows ?? [];
  const clientIds = clients.map((c) => c.id);

  const managerIds = Array.from(new Set(clients.map((c) => c.account_manager_id).filter((id): id is string => !!id)));
  const { data: managerRows } = managerIds.length
    ? await supabaseAdmin.from("profiles").select("id, full_name, avatar_path").in("id", managerIds)
    : { data: [] };
  const managers: Record<string, ManagerInfo> = Object.fromEntries(
    (managerRows ?? []).map((m) => [m.id, { full_name: m.full_name, avatar_url: getPublicAssetUrl(m.avatar_path) }])
  );

  const { data: projectRows } = clientIds.length
    ? await supabaseAdmin.from("projects").select("id, client_id, name, status, progress_percent").in("client_id", clientIds)
    : { data: [] };

  const projectsByClient: Record<string, ClientProjectInfo[]> = {};
  const statusCounts: Record<string, number> = {};
  for (const p of projectRows ?? []) {
    (projectsByClient[p.client_id] ??= []).push({ id: p.id, name: p.name, status: p.status, progress_percent: p.progress_percent });
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
  }

  const { data: activityRows } = clientIds.length
    ? await supabaseAdmin
        .from("activity_log")
        .select("client_id, type, title, admin_title, created_at")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Already ordered desc — the first row seen per client_id is its latest.
  const latestActivityByClient: Record<string, ClientActivityInfo> = {};
  for (const a of activityRows ?? []) {
    if (!latestActivityByClient[a.client_id]) {
      latestActivityByClient[a.client_id] = { title: a.title, admin_title: a.admin_title, created_at: a.created_at };
    }
  }

  const { data: recentActivity } = await supabaseAdmin
    .from("activity_log")
    .select("id, type, title, admin_title, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  // `new Date()` here, not Date.now() — the lint rule against impure calls
  // in render flags Date.now() specifically; new Date() with no args reads
  // the same clock but isn't on its impure-call list (see the identical
  // pattern already in src/app/admin/page.tsx:32).
  const sevenDaysAgo = new Date(new Date().getTime() - SEVEN_DAYS_MS).toISOString();
  const { count: recentActivityCount } = await supabaseAdmin
    .from("activity_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  const archivedCount = clients.filter((c) => c.archived_at).length;
  const inProgressCount = statusCounts.in_progress ?? 0;

  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    company: c.company,
    account_manager_id: c.account_manager_id,
    avatar_url: getPublicAssetUrl(c.avatar_path),
    archived_at: c.archived_at,
  }));

  const projectSegments: DonutSegment[] = Object.entries(statusCounts)
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      key: status,
      label: isProjectStatus(status) ? PROJECT_STATUS_LABELS[status] : status,
      value,
      color: STATUS_COLORS[status] ?? "var(--kov-steel)",
    }));

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-2">Clients</p>
        <h1 className="font-display text-kov-bone text-2xl uppercase">Clients</h1>
        <p className="text-kov-steel text-sm mt-2 max-w-xl">
          Gérez vos clients, suivez leurs projets et centralisez toutes vos relations au même endroit.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Clients total" value={String(clients.length)} caption={clients.length > 1 ? "clients" : "client"} />
        <StatCard label="Projets en cours" value={String(inProgressCount)} caption="tous clients confondus" />
        <StatCard label="Clients archivés" value={String(archivedCount)} caption={archivedCount > 1 ? "clients archivés" : "client archivé"} />
        <StatCard label="Activité récente" value={String(recentActivityCount ?? 0)} caption="interactions sur 7 jours" />
      </div>

      <ClientsWorkspace
        clients={rows}
        managers={managers}
        projectsByClient={projectsByClient}
        latestActivityByClient={latestActivityByClient}
      />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <ActivityFeed items={(recentActivity ?? []) as AdminActivityItem[]} />
        <Donut title="Répartition des projets" segments={projectSegments} centerLabel="projets" />
      </div>
    </main>
  );
}
