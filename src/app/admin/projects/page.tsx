import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ProjectTable } from "@/components/admin/dashboard/ProjectTable";

export const metadata: Metadata = {
  title: "Projets — Admin KOV",
};

export default async function AdminProjectsPage() {
  await requireAdmin();

  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, name, status, progress_percent, next_deadline_date, client_id, project_manager_id")
    .order("created_at", { ascending: false });

  const rows = projects ?? [];
  const clientIds = Array.from(new Set(rows.map((p) => p.client_id)));
  const managerIds = Array.from(new Set(rows.map((p) => p.project_manager_id).filter((id): id is string => !!id)));

  const [{ data: clients }, { data: managers }] = await Promise.all([
    clientIds.length
      ? supabaseAdmin.from("profiles").select("id, full_name, email, company").in("id", clientIds)
      : Promise.resolve({ data: [] }),
    managerIds.length
      ? supabaseAdmin.from("profiles").select("id, full_name, email").in("id", managerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.full_name || c.company || c.email]));
  const managerNameById = new Map((managers ?? []).map((m) => [m.id, m.full_name || m.email]));

  const tableRows = rows.map((p) => ({
    id: p.id,
    name: p.name,
    clientId: p.client_id,
    clientName: clientNameById.get(p.client_id) ?? "—",
    managerName: p.project_manager_id ? managerNameById.get(p.project_manager_id) ?? null : null,
    status: p.status,
    progressPercent: p.progress_percent,
    dueDate: p.next_deadline_date,
  }));

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Projets</h1>
      <ProjectTable projects={tableRows} />
    </main>
  );
}
