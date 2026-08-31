"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { PRIORITIES, PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/admin/status";
import { TaskBoard } from "./TaskBoard";
import { TaskListTable } from "./TaskListTable";
import { NewTaskModal } from "./NewTaskModal";
import type { PickerOption, TaskRow } from "./types";

const FILTER_SELECT_CLASS =
  "bg-transparent border px-3 py-2 text-kov-bone text-xs uppercase tracking-widest focus:outline-none";

export function TaskManagerView({
  initialTasks,
  projects,
  admins,
  phasesByProject,
  initialView,
}: {
  initialTasks: TaskRow[];
  projects: PickerOption[];
  admins: PickerOption[];
  phasesByProject: Record<string, PickerOption[]>;
  initialView: "kanban" | "list";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setViewState] = useState(initialView);

  // Adjusting local editable state when the server-fed prop changes (new
  // task created, revalidatePath refetch) — the documented React pattern
  // (compare during render, setState inline) rather than a useEffect, so a
  // stale mount never keeps optimistic Kanban edits from ever syncing back
  // up with fresh server data.
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  const [tasks, setTasks] = useState(initialTasks);
  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  const [projectFilter, setProjectFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (projectFilter && task.projectId !== projectFilter) return false;
      if (assigneeFilter && task.assignedTo !== assigneeFilter) return false;
      if (priorityFilter && task.priority !== priorityFilter) return false;
      if (statusFilter && task.status !== statusFilter) return false;
      if (q && !task.title.toLowerCase().includes(q) && !task.projectName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, projectFilter, assigneeFilter, priorityFilter, statusFilter, query]);

  function setView(next: "kanban" | "list") {
    setViewState(next);
    router.push(`${pathname}?view=${next}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 border p-1" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
          {(["kanban", "list"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className="px-3 py-1.5 text-xs uppercase tracking-widest transition-colors"
              style={{
                color: view === option ? "var(--kov-white)" : "var(--kov-steel)",
                background: view === option ? "var(--kov-red)" : "transparent",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {option === "kanban" ? "Kanban" : "Liste"}
            </button>
          ))}
        </div>

        <NewTaskModal projects={projects} admins={admins} phasesByProject={phasesByProject} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une tâche…"
          className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />
        <Select
          value={projectFilter}
          onChange={setProjectFilter}
          placeholder="Tous les projets"
          options={projects.map((p) => ({ value: p.id, label: p.label }))}
          className={FILTER_SELECT_CLASS}
          style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
        />
        <Select
          value={assigneeFilter}
          onChange={setAssigneeFilter}
          placeholder="Tous les assignés"
          options={admins.map((a) => ({ value: a.id, label: a.label }))}
          className={FILTER_SELECT_CLASS}
          style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
        />
        <Select
          value={priorityFilter}
          onChange={setPriorityFilter}
          placeholder="Toutes priorités"
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
          className={FILTER_SELECT_CLASS}
          style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
        />
        {view === "list" && (
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Tous statuts"
            options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
            className={FILTER_SELECT_CLASS}
            style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
          />
        )}
        {(projectFilter || assigneeFilter || priorityFilter || statusFilter || query) && (
          <button
            type="button"
            onClick={() => {
              setProjectFilter("");
              setAssigneeFilter("");
              setPriorityFilter("");
              setStatusFilter("");
              setQuery("");
            }}
            className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {view === "kanban" ? <TaskBoard tasks={filteredTasks} setTasks={setTasks} /> : <TaskListTable tasks={filteredTasks} />}
    </div>
  );
}
