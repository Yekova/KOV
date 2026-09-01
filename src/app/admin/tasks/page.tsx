import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { TaskManagerView } from "@/components/admin/tasks/TaskManagerView";
import type { PickerOption, TaskRow } from "@/components/admin/tasks/types";
import { StatCard } from "@/components/admin/StatCard";

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
        "id, title, description, status, priority, due_date, project_id, assigned_to, phase_id, position, created_at, updated_at, validation_status"
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
      createdAt: t.created_at,
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

  const totalCount = taskRows.length;
  const doneCount = taskRows.filter((t) => t.status === "done").length;
  const inProgressCount = taskRows.filter((t) => t.status === "in_progress").length;
  const overdueCount = taskRows.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length;
  const blockedCount = taskRows.filter((t) => t.status === "blocked").length;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const createdThisMonth = taskRows.filter((t) => new Date(t.createdAt) >= startOfMonth).length;
  const pct = (n: number) => (totalCount > 0 ? Math.round((n / totalCount) * 100) : 0);

  return (
    <main className="px-6 py-10 max-w-[1800px] mx-auto w-full space-y-8">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Tâches</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Tâches totales" value={String(totalCount)} caption={`+${createdThisMonth} ce mois`} />
        <StatCard label="Terminées" value={String(doneCount)} caption={`${pct(doneCount)}% du total`} progress={pct(doneCount)} progressColor="#3FB27F" />
        <StatCard label="En cours" value={String(inProgressCount)} caption={`${pct(inProgressCount)}% du total`} progress={pct(inProgressCount)} progressColor="#F5A524" />
        <StatCard label="En retard" value={String(overdueCount)} caption="Nécessite attention" progress={pct(overdueCount)} progressColor="var(--kov-red)" />
        <StatCard label="Bloquées" value={String(blockedCount)} caption={`${pct(blockedCount)}% du total`} progress={pct(blockedCount)} progressColor="#9B6DFF" />
      </div>

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
