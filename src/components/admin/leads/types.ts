// Shared row shape for the Leads Workspace — one flattened record (assignee
// name resolved server-side via a Map lookup, matching the task manager's
// TaskRow convention) fed into the list, the Kanban board, and the
// dashboard widgets so switching views never needs a refetch.
export type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: string;
  source: string | null;
  score: number | null;
  tags: string[];
  budgetCents: number | null;
  assignedTo: string | null;
  assigneeName: string | null;
  lastContactedAt: string | null;
  nextActionNote: string | null;
  nextActionDate: string | null;
  createdAt: string;
};

export type PickerOption = { id: string; label: string };
