import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { ErrorState } from "@/components/admin/ErrorState";
import { ProjectsWorkspace, type ProjectRow } from "@/components/admin/projects/ProjectsWorkspace";

export const metadata: Metadata = {
  title: "Projets — Admin KOV",
};

export default async function AdminProjectsPage() {
  await requireAdmin();

  // One unfiltered fetch, same "fetch once, filter client-side" convention
  // used by the rebuilt Clients page (src/app/admin/clients/page.tsx) —
  // search/status-filter/pagination all move into ProjectsWorkspace so
  // none of them round-trip to the server.
  const { data: projectRows, error: projectsError } = await supabaseAdmin
    .from("projects")
    .select("id, name, category, status, next_deadline_date, created_at, thumbnail_path, client_id")
    .order("created_at", { ascending: false });

  if (projectsError) {
    return (
      <main className="px-6 py-10 max-w-6xl mx-auto w-full">
        <ErrorState message="Impossible de charger les projets." />
      </main>
    );
  }

  const projects = projectRows ?? [];
  const clientIds = Array.from(new Set(projects.map((p) => p.client_id)));

  const [{ data: referencedClients }, { data: allClients }, { data: allAdmins }] = await Promise.all([
    clientIds.length
      ? supabaseAdmin.from("profiles").select("id, full_name, email, company, avatar_path").in("id", clientIds)
      : Promise.resolve({ data: [] }),
    supabaseAdmin.from("profiles").select("id, full_name, company").eq("role", "client").order("full_name"),
    supabaseAdmin.from("profiles").select("id, full_name").eq("role", "admin").order("full_name"),
  ]);

  const clientById = new Map((referencedClients ?? []).map((c) => [c.id, c]));

  const rows: ProjectRow[] = projects.map((p) => {
    const client = clientById.get(p.client_id);
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      status: p.status,
      next_deadline_date: p.next_deadline_date,
      created_at: p.created_at,
      thumbnail_url: getPublicAssetUrl(p.thumbnail_path),
      client_id: p.client_id,
      client_name: client?.full_name || client?.company || "Client sans nom",
      client_company: client?.company ?? null,
      client_avatar_url: getPublicAssetUrl(client?.avatar_path ?? null),
    };
  });

  const clientOptions = (allClients ?? []).map((c) => ({ id: c.id, label: c.full_name || c.company || "Client sans nom" }));
  const adminOptions = (allAdmins ?? []).map((a) => ({ id: a.id, label: a.full_name || "—" }));

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-kov-steel mb-2">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
          Projets
        </p>
        <h1 className="font-display text-kov-bone text-2xl uppercase">Projets</h1>
        <p className="text-kov-steel text-sm mt-2 max-w-xl">
          Suivez l&apos;avancement de vos projets et centralisez toutes les informations au même endroit.
        </p>
      </div>

      <ProjectsWorkspace projects={rows} clientOptions={clientOptions} adminOptions={adminOptions} />
    </main>
  );
}
