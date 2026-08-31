// Shared row shape for the task manager — one flattened, already-joined
// record (project name, assignee name, phase name resolved server-side via
// Map lookups, matching the rest of the admin dashboard's convention) fed
// into both the Kanban board and the list view so switching views never
// needs a refetch.
export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  dueDate: string | null;
  projectId: string;
  projectName: string;
  assignedTo: string | null;
  assigneeName: string | null;
  phaseId: string | null;
  phaseName: string | null;
  position: number;
  checklistDone: number;
  checklistTotal: number;
  updatedAt: string;
  validationStatus: string;
};

export type PickerOption = { id: string; label: string };
