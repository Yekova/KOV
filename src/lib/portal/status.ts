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

export const INVOICE_KINDS = ["full", "deposit", "balance"] as const;
export type InvoiceKind = (typeof INVOICE_KINDS)[number];

export function isInvoiceKind(value: string): value is InvoiceKind {
  return (INVOICE_KINDS as readonly string[]).includes(value);
}

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (INVOICE_STATUSES as readonly string[]).includes(value);
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée",
};

// "overdue" is a real status an admin can set manually, but nothing ever
// transitions a "sent" invoice into it automatically — there's no scheduled
// job in this stack to do that. Rather than add cron infrastructure just to
// flip a column, this derives the same information at display time: always
// accurate, no moving parts, and never fights the dropdown's own authority
// over the stored status (admin can still mark it paid/cancelled normally).
export function isInvoiceOverdue(status: string, dueAt: string | null): boolean {
  return status === "sent" && !!dueAt && new Date(dueAt).getTime() < Date.now();
}

export const QUOTE_STATUSES = ["draft", "sent", "accepted", "declined", "expired", "cancelled"] as const;
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
  cancelled: "Annulé",
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

// Same rationale as isInvoiceOverdue above — "expired" is a real, selectable
// quote status that nothing ever sets automatically.
export function isQuoteExpired(status: string, validUntil: string | null): boolean {
  return status === "sent" && !!validUntil && new Date(validUntil).getTime() < Date.now();
}

export const ACTIVITY_TYPES = ["document", "message", "invoice", "milestone", "quote"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export function isActivityType(value: string): value is ActivityType {
  return (ACTIVITY_TYPES as readonly string[]).includes(value);
}
