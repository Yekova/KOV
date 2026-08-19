export const LEAD_STATUSES = ["new", "contacted", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  won: "Gagné",
  lost: "Perdu",
};

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

export const TASK_STATUSES = ["todo", "in_progress", "done", "blocked"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminée",
  blocked: "Bloquée",
};

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value);
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
};
