// L'avancement d'un projet, et la phase en cours : une seule règle, lue au
// même endroit par l'admin et par le portail client.
//
// Le problème corrigé ici : `projects.progress_percent` et
// `projects.deadline_phase_label` étaient saisis à la main dans un
// formulaire, pendant que `project_phases` vivait sa vie dans un autre
// écran. Deux sources pour un même fait, qui se contredisaient en silence —
// une phase marquée terminée côté admin pendant que le client lisait
// toujours l'ancienne dans sa barre de progression.
//
// La règle est volontairement simple à énoncer, parce qu'elle doit pouvoir
// être dite à un client : **dès qu'un projet a des phases, elles font foi.**
// Sans phase, les champs saisis à la main restent la source. Aucun réglage,
// aucun mode à choisir : le fait d'avoir créé des phases est le choix.

export const PHASE_STATUSES = ["not_started", "in_progress", "review", "completed", "blocked"] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  not_started: "À venir",
  in_progress: "En cours",
  review: "En relecture",
  completed: "Terminée",
  blocked: "En attente",
};

export interface ProjectPhase {
  id: string;
  name: string;
  status: string;
  position: number;
  /** Renseignés depuis l'admin, affichés au client quand ils existent. Les
   *  colonnes existaient depuis la création de la table sans que rien ne
   *  les écrive ; les listes qui n'en ont pas besoin ne les demandent pas. */
  description?: string | null;
  start_date?: string | null;
  due_date?: string | null;
}

export interface DerivedProgress {
  percent: number;
  /** D'où vient le chiffre. Affiché à l'admin pour qu'il sache si son champ
   *  de saisie sert encore à quelque chose. */
  source: "phases" | "saisi";
  completed: number;
  total: number;
}

/** Seules les phases terminées comptent.
 *
 *  Une phase « en cours » ou « en relecture » ne vaut pas la moitié d'une
 *  phase : cette demi-part serait une pondération inventée, et ce
 *  pourcentage est lu par un client. Une phase est finie ou elle ne l'est
 *  pas. Le détail, lui, est visible dans la liste des phases, qui montre
 *  l'état réel de chacune. */
export function deriveProgress(phases: ProjectPhase[], manualPercent: number | null): DerivedProgress {
  if (phases.length === 0) {
    return { percent: manualPercent ?? 0, source: "saisi", completed: 0, total: 0 };
  }
  const completed = phases.filter((phase) => phase.status === "completed").length;
  return {
    percent: Math.round((completed / phases.length) * 100),
    source: "phases",
    completed,
    total: phases.length,
  };
}

export interface DerivedPhase {
  label: string | null;
  status: PhaseStatus | null;
  source: "phases" | "saisi";
}

/** La phase en cours : la première non terminée, dans l'ordre d'affichage.
 *
 *  Toutes terminées rend un libellé nul plutôt que « Terminé » : c'est au
 *  rendu de décider quoi en faire, et le statut du projet le dit déjà
 *  mieux. */
export function deriveCurrentPhase(phases: ProjectPhase[], manualLabel: string | null): DerivedPhase {
  if (phases.length === 0) {
    return { label: manualLabel?.trim() || null, status: null, source: "saisi" };
  }
  const ordered = [...phases].sort((a, b) => a.position - b.position);
  const current = ordered.find((phase) => phase.status !== "completed");
  if (!current) return { label: null, status: null, source: "phases" };
  return {
    label: current.name,
    status: (PHASE_STATUSES as readonly string[]).includes(current.status) ? (current.status as PhaseStatus) : null,
    source: "phases",
  };
}

/** Range les phases par projet à partir d'une seule lecture.
 *
 *  Les listes du portail affichent plusieurs projets : une requête par
 *  projet ferait une requête par ligne pour une information d'en-tête. */
export function groupPhasesByProject<T extends { project_id: string }>(rows: T[] | null): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows ?? []) {
    grouped.set(row.project_id, [...(grouped.get(row.project_id) ?? []), row]);
  }
  return grouped;
}

/** « Du 3 au 18 mars », ou juste l'une des deux bornes, ou rien.
 *
 *  Rend une chaîne vide plutôt qu'un tiret quand les deux dates manquent :
 *  une colonne qui affiche « — » à chaque ligne apprend à ne plus être lue. */
export function formatPhaseDates(startDate?: string | null, dueDate?: string | null): string {
  const format = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  if (startDate && dueDate) return `du ${format(startDate)} au ${format(dueDate)}`;
  if (dueDate) return `jusqu'au ${format(dueDate)}`;
  if (startDate) return `depuis le ${format(startDate)}`;
  return "";
}
