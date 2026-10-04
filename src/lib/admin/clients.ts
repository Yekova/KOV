import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { getClientAccessMap } from "@/lib/clients/access";
import type { AccessStatus } from "@/lib/clients/accessStatus";
import { deriveProgress, deriveCurrentPhase, type ProjectPhase } from "@/lib/portal/progress";
import { PROJECT_STATUS_LABELS, isProjectStatus, type ProjectStatus } from "@/lib/portal/status";

// Ce qu'on sait vraiment de chaque client.
//
// La liste des clients affichait le nom, l'email, le nombre de projets et la
// date de dernière activité. C'est un annuaire. La question qu'on se pose en
// ouvrant cet écran est autre : où en est ce client, et qu'est-ce qui
// l'attend. Y répondre demande de rassembler cinq tables.
//
// ── DEUX RÈGLES QUI TIENNENT TOUT ────────────────────────────────────────
//
// 1. Les phases font foi. Quand un projet a des phases, elles pilotent
//    l'avancement et la phase en cours ; sinon les champs manuels prennent
//    le relais. C'est la règle déjà posée dans lib/portal/progress.ts, et la
//    respecter ici évite qu'un même projet affiche 16 % côté admin et 40 %
//    côté client.
//
// 2. Rien n'est affiché sans source. Pas de secteur d'activité, parce
//    qu'aucune colonne ne le porte. Pas d'équipe fabriquée : elle se lit sur
//    les assignations de tâches réelles. Une carte à moitié vide dit la
//    vérité sur ce qui manque en base ; une carte remplie de plausible ment.

export interface ClientTeamMember {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  /** Le responsable de compte est distingué : c'est l'interlocuteur, pas un exécutant. */
  isAccountManager: boolean;
}

export interface ClientProjectSummary {
  id: string;
  name: string;
  status: ProjectStatus | string;
  statusLabel: string;
  /** Issu des phases quand il y en a, du champ manuel sinon. */
  progressPercent: number;
  progressSource: "phases" | "saisi";
  /** « 3 sur 7 » dit ce qu'un pourcentage seul cache : combien il en reste. */
  phasesCompleted: number;
  phasesTotal: number;
  currentPhaseName: string | null;
  nextDeadlineDate: string | null;
  nextDeadlineLabel: string | null;
}

export interface ClientSummary {
  id: string;
  fullName: string | null;
  company: string | null;
  email: string | null;
  avatarUrl: string | null;
  archivedAt: string | null;
  createdAt: string;
  accountManager: ClientTeamMember | null;
  team: ClientTeamMember[];
  projects: ClientProjectSummary[];
  /** Le projet que la carte met en avant. Null si le client n'en a aucun. */
  leadProject: ClientProjectSummary | null;
  /** Le statut du client, dérivé de ses projets. Null quand il n'en a pas. */
  status: ProjectStatus | null;
  /** L'état de son espace, déduit de auth.users. Ce qui permet de repérer
   *  d'un coup d'œil celui qui n'a jamais activé son compte. */
  accessStatus: AccessStatus;
  lastActivity: { title: string; createdAt: string } | null;
}

// L'ordre dans lequel un statut « gagne » quand un client a plusieurs
// projets : un client qui a un projet en cours est en cours, même si trois
// autres sont livrés. C'est ce qu'on veut savoir d'un coup d'œil.
const STATUS_RANK: Record<string, number> = {
  in_progress: 0,
  in_review: 1,
  on_hold: 2,
  done: 3,
};

function rankOf(status: string): number {
  return STATUS_RANK[status] ?? 99;
}

export async function getClientSummaries(): Promise<ClientSummary[]> {
  const { data: clientRows } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, company, account_manager_id, avatar_path, created_at, archived_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const clients = clientRows ?? [];
  if (clients.length === 0) return [];
  const clientIds = clients.map((row) => row.id as string);

  // Un seul appel pour toute la liste : getClientAccessMap lit auth.users
  // en une page de mille, là où une lecture par ligne ferait quarante
  // allers-retours sur une page qui en affiche quarante.
  const accessByClient = await getClientAccessMap(clientIds);

  const { data: projectRows } = await supabaseAdmin
    .from("projects")
    .select("id, client_id, name, status, progress_percent, next_deadline_date, deadline_phase_label, created_at")
    .in("client_id", clientIds);

  const projects = projectRows ?? [];
  const projectIds = projects.map((row) => row.id as string);

  const [{ data: phaseRows }, { data: taskRows }, { data: activityRows }] = await Promise.all([
    projectIds.length
      ? supabaseAdmin
          .from("project_phases")
          .select("id, project_id, name, status, position, start_date, due_date")
          .in("project_id", projectIds)
          .order("position", { ascending: true })
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? supabaseAdmin.from("project_tasks").select("project_id, assigned_to").in("project_id", projectIds)
      : Promise.resolve({ data: [] }),
    supabaseAdmin
      .from("activity_log")
      .select("client_id, title, admin_title, created_at")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false }),
  ]);

  const phasesByProject = new Map<string, ProjectPhase[]>();
  for (const row of phaseRows ?? []) {
    const projectId = row.project_id as string;
    phasesByProject.set(projectId, [
      ...(phasesByProject.get(projectId) ?? []),
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

  // L'équipe se lit sur les assignations réelles, plus le responsable de
  // compte. Un client sans tâche assignée n'a donc pas d'équipe affichée, et
  // c'est exact : personne n'a encore été mis dessus.
  const memberIdsByClient = new Map<string, Set<string>>();
  const projectClient = new Map(projects.map((row) => [row.id as string, row.client_id as string]));
  for (const row of taskRows ?? []) {
    const assignee = row.assigned_to as string | null;
    if (!assignee) continue;
    const clientId = projectClient.get(row.project_id as string);
    if (!clientId) continue;
    const current = memberIdsByClient.get(clientId) ?? new Set<string>();
    current.add(assignee);
    memberIdsByClient.set(clientId, current);
  }

  const peopleIds = new Set<string>();
  for (const row of clients) {
    const manager = row.account_manager_id as string | null;
    if (manager) peopleIds.add(manager);
  }
  for (const set of memberIdsByClient.values()) for (const id of set) peopleIds.add(id);

  const { data: peopleRows } = peopleIds.size
    ? await supabaseAdmin.from("profiles").select("id, full_name, avatar_path").in("id", Array.from(peopleIds))
    : { data: [] };
  const people = new Map(
    (peopleRows ?? []).map((row) => [
      row.id as string,
      { name: (row.full_name as string | null) ?? null, avatarUrl: getPublicAssetUrl(row.avatar_path as string | null) },
    ])
  );

  // Déjà trié par date décroissante : la première ligne vue pour un client
  // est la plus récente.
  const lastActivityByClient = new Map<string, { title: string; createdAt: string }>();
  for (const row of activityRows ?? []) {
    const clientId = row.client_id as string;
    if (lastActivityByClient.has(clientId)) continue;
    lastActivityByClient.set(clientId, {
      title: ((row.admin_title as string | null) || (row.title as string)) ?? "",
      createdAt: row.created_at as string,
    });
  }

  const projectsByClient = new Map<string, ClientProjectSummary[]>();
  for (const row of projects) {
    const phases = phasesByProject.get(row.id as string) ?? [];
    const progress = deriveProgress(phases, row.progress_percent as number | null);
    const phase = deriveCurrentPhase(phases, (row.deadline_phase_label as string | null) ?? null);
    const status = row.status as string;

    const summary: ClientProjectSummary = {
      id: row.id as string,
      name: row.name as string,
      status,
      statusLabel: isProjectStatus(status) ? PROJECT_STATUS_LABELS[status] : status,
      progressPercent: progress.percent,
      progressSource: progress.source,
      phasesCompleted: progress.completed,
      phasesTotal: progress.total,
      currentPhaseName: phase.label,
      nextDeadlineDate: (row.next_deadline_date as string | null) ?? null,
      nextDeadlineLabel: (row.deadline_phase_label as string | null) ?? null,
    };

    const clientId = row.client_id as string;
    projectsByClient.set(clientId, [...(projectsByClient.get(clientId) ?? []), summary]);
  }

  return clients.map((row) => {
    const id = row.id as string;
    const managerId = row.account_manager_id as string | null;
    const managerInfo = managerId ? people.get(managerId) : undefined;
    const accountManager: ClientTeamMember | null =
      managerId && managerInfo
        ? { id: managerId, name: managerInfo.name, avatarUrl: managerInfo.avatarUrl, isAccountManager: true }
        : null;

    const team: ClientTeamMember[] = [];
    if (accountManager) team.push(accountManager);
    for (const memberId of memberIdsByClient.get(id) ?? []) {
      if (memberId === managerId) continue;
      const info = people.get(memberId);
      if (!info) continue;
      team.push({ id: memberId, name: info.name, avatarUrl: info.avatarUrl, isAccountManager: false });
    }

    // Le projet mis en avant : le plus « vivant » d'abord, puis celui dont
    // l'échéance tombe le plus tôt. Une échéance absente passe après une
    // échéance connue, jamais avant : ne rien savoir n'est pas urgent.
    const clientProjects = [...(projectsByClient.get(id) ?? [])].sort((a, b) => {
      const byStatus = rankOf(a.status) - rankOf(b.status);
      if (byStatus !== 0) return byStatus;
      if (a.nextDeadlineDate && b.nextDeadlineDate) return a.nextDeadlineDate.localeCompare(b.nextDeadlineDate);
      if (a.nextDeadlineDate) return -1;
      if (b.nextDeadlineDate) return 1;
      return a.name.localeCompare(b.name);
    });

    const leadProject = clientProjects[0] ?? null;
    const status =
      leadProject && isProjectStatus(leadProject.status) ? (leadProject.status as ProjectStatus) : null;

    return {
      id,
      fullName: (row.full_name as string | null) ?? null,
      company: (row.company as string | null) ?? null,
      email: (row.email as string | null) ?? null,
      avatarUrl: getPublicAssetUrl(row.avatar_path as string | null),
      archivedAt: (row.archived_at as string | null) ?? null,
      createdAt: row.created_at as string,
      accountManager,
      team,
      projects: clientProjects,
      leadProject,
      status,
      accessStatus: accessByClient.get(id) ?? "pending",
      lastActivity: lastActivityByClient.get(id) ?? null,
    };
  });
}

/** Le nom à afficher : la société d'abord, puis la personne, puis l'email. */
export function clientDisplayName(client: Pick<ClientSummary, "company" | "fullName" | "email">): string {
  return client.company?.trim() || client.fullName?.trim() || client.email || "Client sans nom";
}

/** La ligne sous le nom, quand elle apporte quelque chose de plus. */
export function clientSubtitle(client: Pick<ClientSummary, "company" | "fullName" | "email">): string | null {
  const primary = clientDisplayName(client);
  const candidates = [client.fullName?.trim(), client.email].filter((value): value is string => Boolean(value));
  return candidates.find((value) => value !== primary) ?? null;
}
