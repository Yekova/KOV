import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { TaskManagerView } from "@/components/admin/tasks/TaskManagerView";
import type { PickerOption, TaskRow } from "@/components/admin/tasks/types";

export const metadata: Metadata = {
  title: "Tâches — Admin KOV",
};

export default async function AdminTasksPage(props: PageProps<"/admin/tasks">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const initialView = searchParams.view === "list" ? "list" : "kanban";

  const [{ data: tasks }, { data: projects }, { data: admins }, { data: phases }, { data: checklistItems }] = await Promise.all([
    supabaseAdmin
      .from("project_tasks")
      .select(
        "id, title, description, status, priority, due_date, project_id, assigned_to, phase_id, position, updated_at, validation_status"
      )
      .order("position"),
    supabaseAdmin.from("projects").select("id, name").order("name"),
    supabaseAdmin.from("profiles").select("id, full_name, email").eq("role", "admin").is("archived_at", null).order("full_name"),
    supabaseAdmin.from("project_phases").select("id, project_id, name").order("position"),
    supabaseAdmin.from("task_checklist_items").select("task_id, is_done"),
  ]);

  const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.name]));
  const adminNameById = new Map((admins ?? []).map((a) => [a.id, a.full_name || a.email]));
  const phaseNameById = new Map((phases ?? []).map((p) => [p.id, p.name]));

  const checklistByTask = new Map<string, { done: number; total: number }>();
  for (const item of checklistItems ?? []) {
    const entry = checklistByTask.get(item.task_id) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (item.is_done) entry.done += 1;
    checklistByTask.set(item.task_id, entry);
  }

  const taskRows: TaskRow[] = (tasks ?? []).map((t) => {
    const checklist = checklistByTask.get(t.id);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date,
      projectId: t.project_id,
      projectName: projectNameById.get(t.project_id) ?? "—",
      assignedTo: t.assigned_to,
      assigneeName: t.assigned_to ? adminNameById.get(t.assigned_to) ?? null : null,
      phaseId: t.phase_id,
      phaseName: t.phase_id ? phaseNameById.get(t.phase_id) ?? null : null,
      position: t.position,
      checklistDone: checklist?.done ?? 0,
      checklistTotal: checklist?.total ?? 0,
      updatedAt: t.updated_at,
      validationStatus: t.validation_status,
    };
  });

  const projectOptions: PickerOption[] = (projects ?? []).map((p) => ({ id: p.id, label: p.name }));
  const adminOptions: PickerOption[] = (admins ?? []).map((a) => ({ id: a.id, label: a.full_name || a.email }));

  const phasesByProject: Record<string, PickerOption[]> = {};
  for (const phase of phases ?? []) {
    const list = phasesByProject[phase.project_id] ?? [];
    list.push({ id: phase.id, label: phase.name });
    phasesByProject[phase.project_id] = list;
  }

  return (
    <main className="px-6 py-10 max-w-[1800px] mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Tâches</h1>
      <TaskManagerView
        initialTasks={taskRows}
        projects={projectOptions}
        admins={adminOptions}
        phasesByProject={phasesByProject}
        initialView={initialView}
      />
    </main>
  );
}
