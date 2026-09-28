import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { deriveProgress, deriveCurrentPhase, type ProjectPhase } from "@/lib/portal/progress";
import { PROJECT_STATUS_LABELS, isProjectStatus, type ProjectStatus } from "@/lib/portal/status";

// Ce qu'on sait vraiment de chaque projet.
//
// La liste des projets chargeait le nom, la catégorie, le statut, l'échéance
// et le client. Pas l'avancement. C'est la colonne qu'on vient chercher sur
// un écran qui s'appelle « Projets », et elle n'y était pas — il fallait
// ouvrir chaque fiche pour savoir où en était chacun.
//
// Même règle qu'ailleurs : les phases font foi quand il y en a, le champ
// manuel sinon, et l'écran DIT lequel des deux il montre. Un pourcentage
// dont on ignore l'origine ne se vérifie pas.

export interface ProjectTeamMember {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  category: string | null;
  status: ProjectStatus | string;
  statusLabel: string;
  thumbnailUrl: string | null;
  createdAt: string;

  clientId: string;
  clientName: string;
  clientAvatarUrl: string | null;

  progressPercent: number;
  progressSource: "phases" | "saisi";
  phasesCompleted: number;
  phasesTotal: number;
  currentPhaseName: string | null;

  nextDeadlineDate: string | null;
  nextDeadlineLabel: string | null;
  /** Une échéance passée sur un projet qui n'est pas terminé. */
  deadlineOverdue: boolean;

  tasksTotal: number;
  tasksDone: number;
  /** Tâches à rendre dont la date est passée et qui ne sont pas faites. */
  tasksOverdue: number;
  /** Tâches en attente de validation client, comptées sans jamais montrer leurs titres. */
  tasksAwaitingClient: number;

  team: ProjectTeamMember[];
}

function today(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const { data: projectRows } = await supabaseAdmin
    .from("projects")
    .select("id, name, category, status, progress_percent, next_deadline_date, deadline_phase_label, created_at, thumbnail_path, client_id")
    .order("created_at", { ascending: false });

  const projects = projectRows ?? [];
  if (projects.length === 0) return [];

  const projectIds = projects.map((row) => row.id as string);
  const clientIds = Array.from(new Set(projects.map((row) => row.client_id as string).filter(Boolean)));

  const [{ data: phaseRows }, { data: taskRows }, { data: clientRows }] = await Promise.all([
    supabaseAdmin
      .from("project_phases")
      .select("id, project_id, name, status, position, start_date, due_date")
      .in("project_id", projectIds)
      .order("position", { ascending: true }),
    supabaseAdmin
      .from("project_tasks")
      .select("project_id, status, due_date, assigned_to, validation_status")
      .in("project_id", projectIds),
    clientIds.length
      ? supabaseAdmin.from("profiles").select("id, full_name, company, email, avatar_path").in("id", clientIds)
      : Promise.resolve({ data: [] }),
  ]);

  const phasesByProject = new Map<string, ProjectPhase[]>();
  for (const row of phaseRows ?? []) {
    const id = row.project_id as string;
    phasesByProject.set(id, [
      ...(phasesByProject.get(id) ?? []),
      {
        id: row.id as string,
        name: row.name as string,
        status: row.status as string,
        position: row.position as number,
        start_date: (row.start_date as string | null) ?? null,
        due_date: (row.due_date as string | null) ?? null,
      },
    ]);
  }

  const todayIso = today();
  const taskStats = new Map<string, { total: number; done: number; overdue: number; awaitingClient: number; assignees: Set<string> }>();
  for (const row of taskRows ?? []) {
    const id = row.project_id as string;
    const stats = taskStats.get(id) ?? { total: 0, done: 0, overdue: 0, awaitingClient: 0, assignees: new Set<string>() };
    stats.total += 1;
    const isDone = row.status === "done";
    if (isDone) stats.done += 1;
    const due = row.due_date as string | null;
    if (!isDone && due && due < todayIso) stats.overdue += 1;
    if (row.validation_status === "client_review") stats.awaitingClient += 1;
    const assignee = row.assigned_to as string | null;
    if (assignee) stats.assignees.add(assignee);
    taskStats.set(id, stats);
  }

  const assigneeIds = new Set<string>();
  for (const stats of taskStats.values()) for (const id of stats.assignees) assigneeIds.add(id);

  const { data: peopleRows } = assigneeIds.size
    ? await supabaseAdmin.from("profiles").select("id, full_name, avatar_path").in("id", Array.from(assigneeIds))
    : { data: [] };
  const people = new Map(
    (peopleRows ?? []).map((row) => [
      row.id as string,
      {
        id: row.id as string,
        name: (row.full_name as string | null) ?? null,
        avatarUrl: getPublicAssetUrl(row.avatar_path as string | null),
      },
    ])
  );

  const clients = new Map(
    (clientRows ?? []).map((row) => [
      row.id as string,
      {
        // La société d'abord : c'est sous ce nom que le projet est facturé.
        name:
          (row.company as string | null)?.trim() ||
          (row.full_name as string | null)?.trim() ||
          (row.email as string | null) ||
          "Client sans nom",
        avatarUrl: getPublicAssetUrl(row.avatar_path as string | null),
      },
    ])
  );

  return projects.map((row) => {
    const id = row.id as string;
    const phases = phasesByProject.get(id) ?? [];
    const progress = deriveProgress(phases, row.progress_percent as number | null);
    const phase = deriveCurrentPhase(phases, (row.deadline_phase_label as string | null) ?? null);
    const stats = taskStats.get(id);
    const status = row.status as string;
    const deadline = (row.next_deadline_date as string | null) ?? null;
    const client = clients.get(row.client_id as string);

    return {
      id,
      name: row.name as string,
      category: (row.category as string | null) ?? null,
      status,
      statusLabel: isProjectStatus(status) ? PROJECT_STATUS_LABELS[status] : status,
      thumbnailUrl: getPublicAssetUrl(row.thumbnail_path as string | null),
      createdAt: row.created_at as string,

      clientId: row.client_id as string,
      clientName: client?.name ?? "Client sans nom",
      clientAvatarUrl: client?.avatarUrl ?? null,

      progressPercent: progress.percent,
      progressSource: progress.source,
      phasesCompleted: progress.completed,
      phasesTotal: progress.total,
      currentPhaseName: phase.label,

      nextDeadlineDate: deadline,
      nextDeadlineLabel: (row.deadline_phase_label as string | null) ?? null,
      // Un projet terminé n'est jamais « en retard » : sa date est passée
      // parce qu'il est fini, pas parce qu'il a dérapé.
      deadlineOverdue: Boolean(deadline && deadline < todayIso && status !== "done"),

      tasksTotal: stats?.total ?? 0,
      tasksDone: stats?.done ?? 0,
      tasksOverdue: stats?.overdue ?? 0,
      tasksAwaitingClient: stats?.awaitingClient ?? 0,

      team: Array.from(stats?.assignees ?? [])
        .map((memberId) => people.get(memberId))
        .filter((member): member is ProjectTeamMember => Boolean(member)),
    };
  });
}
