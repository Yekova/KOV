export const PROJECT_STATUSES = ["in_progress", "in_review", "done", "on_hold"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  in_progress: "En cours",
  in_review: "En validation",
  done: "Terminés",
  on_hold: "En attente",
};

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (INVOICE_STATUSES as readonly string[]).includes(value);
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  overdue: "En retard",
};

export const QUOTE_STATUSES = ["draft", "sent", "accepted", "declined", "expired"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export function isQuoteStatus(value: string): value is QuoteStatus {
  return (QUOTE_STATUSES as readonly string[]).includes(value);
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  declined: "Refusé",
  expired: "Expiré",
};

export const REQUEST_THREAD_STATUSES = ["open", "answered", "closed"] as const;
export type RequestThreadStatus = (typeof REQUEST_THREAD_STATUSES)[number];

export function isRequestThreadStatus(value: string): value is RequestThreadStatus {
  return (REQUEST_THREAD_STATUSES as readonly string[]).includes(value);
}

export const REQUEST_THREAD_STATUS_LABELS: Record<RequestThreadStatus, string> = {
  open: "Ouverte",
  answered: "Répondue",
  closed: "Fermée",
};

export const ACTIVITY_TYPES = ["document", "message", "invoice", "milestone"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export function isActivityType(value: string): value is ActivityType {
  return (ACTIVITY_TYPES as readonly string[]).includes(value);
}
