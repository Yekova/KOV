export const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  proposal: "Proposition",
  negotiation: "Négociation",
  won: "Converti",
  lost: "Perdu",
};

// The funnel's linear order — deliberately excludes 'lost', which is a
// terminal exit reachable from any stage, not a step along the pipeline.
export const LEAD_PIPELINE_STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won"] as const;

// A small semantic palette scoped to the leads pipeline visualization
// (funnel bars, source donut, status pill) — distinct from KOV's own
// red-only accent system used everywhere else in the admin, because here
// color carries real meaning (which stage a lead is at), the same
// "semantic color is separate from your brand accent" case that justifies
// stepping outside the brand palette. 'negotiation' reuses KOV red on
// purpose — the hottest active stage naturally lines up with the brand's
// one accent color.
export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: "var(--kov-steel)",
  contacted: "#5B8DEF",
  qualified: "#9B6DFF",
  proposal: "#F5A524",
  negotiation: "var(--kov-red)",
  won: "#3FB27F",
  lost: "var(--kov-steel)",
};

// Free-text in the DB (no CHECK constraint) — this is the canonical,
// selectable set going forward. Existing raw values ("contact-page" from
// the public form, "admin-manuel" from quick-add) are grouped into these
// via normalizeLeadSource for the source donut, never rewritten in place.
export const LEAD_SOURCES = ["site_web", "reseaux_sociaux", "recommandation", "linkedin", "autre"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export function isLeadSource(value: string): value is LeadSource {
  return (LEAD_SOURCES as readonly string[]).includes(value);
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  site_web: "Site web",
  reseaux_sociaux: "Réseaux sociaux",
  recommandation: "Recommandation",
  linkedin: "LinkedIn",
  autre: "Autre",
};

export const LEAD_SOURCE_COLORS: Record<LeadSource, string> = {
  site_web: "var(--kov-red)",
  reseaux_sociaux: "#F5A524",
  recommandation: "#9B6DFF",
  linkedin: "#5B8DEF",
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
