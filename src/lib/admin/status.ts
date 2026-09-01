// Lead pipeline stages moved to a DB-backed, admin-configurable table —
// see src/lib/leads/statuses.ts (getLeadStatuses) and
// /admin/settings/lead-statuses. No more hardcoded LEAD_STATUSES here.

// Free-text in the DB (no CHECK constraint) — this is the canonical,
// selectable set going forward. Existing raw values ("contact-page" from
// the public form, "admin-manuel" from quick-add) are grouped into these
// via normalizeLeadSource for the source donut, never rewritten in place.
export const LEAD_SOURCES = ["site_web", "reseaux_sociaux", "recommandation", "linkedin", "newsletter", "autre"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export function isLeadSource(value: string): value is LeadSource {
  return (LEAD_SOURCES as readonly string[]).includes(value);
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  site_web: "Site web",
  reseaux_sociaux: "Réseaux sociaux",
  recommandation: "Recommandation",
  linkedin: "LinkedIn",
  newsletter: "Newsletter",
  autre: "Autre",
};

export const LEAD_SOURCE_COLORS: Record<LeadSource, string> = {
  site_web: "var(--kov-red)",
  reseaux_sociaux: "#F5A524",
  recommandation: "#9B6DFF",
  linkedin: "#5B8DEF",
  newsletter: "#3FB27F",
  autre: "var(--kov-steel)",
};

export function normalizeLeadSource(raw: string | null): LeadSource {
  if (!raw) return "autre";
  if (isLeadSource(raw)) return raw;
  if (raw === "contact-page") return "site_web";
  return "autre";
}

// Internal sales/delivery funnel position — distinct from projects.status
// (client-facing progress state). Deliberately not reusing "in_progress" as
// a value here: that string already means something different on `status`.
export const PIPELINE_STAGES = ["discovery", "proposal", "production", "review", "delivery"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export function isPipelineStage(value: string): value is PipelineStage {
  return (PIPELINE_STAGES as readonly string[]).includes(value);
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  discovery: "Découverte",
  proposal: "Proposition",
  production: "En cours",
  review: "Relecture",
  delivery: "Livraison",
};

export const TASK_STATUSES = ["backlog", "todo", "in_progress", "in_review", "client_review", "blocked", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "À faire",
  in_progress: "En cours",
  in_review: "En révision",
  client_review: "Validation client",
  blocked: "Bloquée",
  done: "Terminée",
};

// The Kanban board only shows these 5 as real columns — blocked and
// client_review render as a badge on the card instead (see
// project_tasks.status' own migration comment: a task can be "in review"
// and "blocked" at once, which one column position can't express).
export const TASK_KANBAN_STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"] as const;

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value);
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

// Scoped to task cards/rows/badges — semantic color, separate from KOV's
// red-only brand accent (same reasoning as lead_statuses.color). urgent
// reuses the brand red on purpose (the one priority that should read as
// "same urgency as the brand's own signal color").
export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "var(--kov-steel)",
  medium: "#F5A524",
  high: "var(--kov-red-signal)",
  urgent: "var(--kov-red)",
};

// Ordered forward path through the task workflow — used to offer a single
// "next step" action in the task detail panel instead of making every
// transition equally prominent. blocked/done have no default forward step.
export const TASK_NEXT_STATUS: Partial<Record<TaskStatus, { status: TaskStatus; label: string }>> = {
  backlog: { status: "todo", label: "Passer à faire" },
  todo: { status: "in_progress", label: "Démarrer" },
  in_progress: { status: "in_review", label: "Envoyer en review" },
  in_review: { status: "done", label: "Marquer terminée" },
  client_review: { status: "done", label: "Marquer terminée" },
};

export const VALIDATION_STATUSES = ["not_required", "internal_review", "client_review", "approved", "changes_requested"] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export function isValidationStatus(value: string): value is ValidationStatus {
  return (VALIDATION_STATUSES as readonly string[]).includes(value);
}

export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  not_required: "Aucune validation requise",
  internal_review: "Relecture interne",
  client_review: "En attente du client",
  approved: "Approuvée",
  changes_requested: "Modifications demandées",
};

export const PROJECT_PHASE_STATUSES = ["not_started", "in_progress", "review", "completed", "blocked"] as const;
export type ProjectPhaseStatus = (typeof PROJECT_PHASE_STATUSES)[number];

export function isProjectPhaseStatus(value: string): value is ProjectPhaseStatus {
  return (PROJECT_PHASE_STATUSES as readonly string[]).includes(value);
}

export const PROJECT_PHASE_STATUS_LABELS: Record<ProjectPhaseStatus, string> = {
  not_started: "Pas commencée",
  in_progress: "En cours",
  review: "Relecture",
  completed: "Terminée",
  blocked: "Bloquée",
};

// KOV's own default phase set — a convenience "add these" button in the
// phase UI, not an auto-seeded/hardcoded system (see docs comment in the
// plan: templates are a later, separate concern).
export const KOV_DEFAULT_PHASES = ["Discovery", "Structure", "Design", "Development", "Motion", "Launch", "Evolution"] as const;

// How a lead asked to be recontacted, captured by the /contact wizard.
export const CONTACT_METHODS = ["phone", "video", "in_person"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export function isContactMethod(value: string): value is ContactMethod {
  return (CONTACT_METHODS as readonly string[]).includes(value);
}

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  phone: "Appel téléphonique",
  video: "Visioconférence",
  in_person: "En personne",
};

export const LEAD_TIMELINES = ["today", "week", "month"] as const;
export type LeadTimeline = (typeof LEAD_TIMELINES)[number];

export function isLeadTimeline(value: string): value is LeadTimeline {
  return (LEAD_TIMELINES as readonly string[]).includes(value);
}

export const LEAD_TIMELINE_LABELS: Record<LeadTimeline, string> = {
  today: "Dès aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois-ci",
};
