import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ProjectsWorkspace } from "@/components/admin/projects/ProjectsWorkspace";
import { getProjectSummaries } from "@/lib/admin/projects";

export const metadata: Metadata = { title: "Projets — Admin KOV" };

export default async function AdminProjectsPage() {
  await requireAdmin();

  const [projects, { data: allClients }, { data: allAdmins }] = await Promise.all([
    getProjectSummaries(),
    supabaseAdmin.from("profiles").select("id, full_name, company").eq("role", "client").order("full_name"),
    supabaseAdmin.from("profiles").select("id, full_name").eq("role", "admin").order("full_name"),
  ]);

  const clientOptions = (allClients ?? []).map((row) => ({
    id: row.id as string,
    label: (row.company as string | null) || (row.full_name as string | null) || "Client sans nom",
  }));
  const adminOptions = (allAdmins ?? []).map((row) => ({
    id: row.id as string,
    label: (row.full_name as string | null) || "—",
  }));

  // Ce qu'aucune carte prise séparément ne peut dire : combien de projets
  // ont dérapé. C'est la seule statistique de cet écran, et elle compte des
  // lignes réelles.
  const overdueProjects = projects.filter((project) => project.deadlineOverdue).length;
  const overdueTasks = projects.reduce((sum, project) => sum + project.tasksOverdue, 0);
  const awaitingClient = projects.reduce((sum, project) => sum + project.tasksAwaitingClient, 0);

  const alerts = [
    overdueProjects > 0 && `${overdueProjects} projet${overdueProjects > 1 ? "s" : ""} dont l'échéance est dépassée`,
    overdueTasks > 0 && `${overdueTasks} tâche${overdueTasks > 1 ? "s" : ""} en retard`,
    awaitingClient > 0 && `${awaitingClient} en attente de validation client`,
  ].filter((value): value is string => Boolean(value));

  return (
    <main className="px-6 py-10 max-w-[1600px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Projets</h1>
        <p className="text-kov-steel text-sm mt-2 max-w-xl">
          Où en est chacun, et ce qui tombe ensuite.
        </p>
        {/* Pas de rangée d'indicateurs : les onglets portent déjà les
            comptes par statut et chaque carte porte son échéance. Une ligne
            de plus les redirait. Seul ce qui n'est visible nulle part
            ailleurs est écrit ici. */}
        {alerts.length > 0 && (
          <p className="text-sm mt-3" style={{ color: "var(--kov-red)" }}>
            {alerts.join(" · ")}
          </p>
        )}
      </div>

      <ProjectsWorkspace projects={projects} clientOptions={clientOptions} adminOptions={adminOptions} />
    </main>
  );
}
