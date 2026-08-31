"use client";

import { Fragment, useMemo, useState } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DateBadge } from "@/components/admin/DateBadge";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { TASK_STATUS_LABELS, PRIORITY_LABELS, type TaskStatus, type Priority } from "@/lib/admin/status";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { useTaskPanel } from "./TaskPanelContext";
import type { TaskRow } from "./types";

type SortKey = "title" | "dueDate" | "priority" | "updatedAt";
type GroupBy = "none" | "project" | "assignee";

const PRIORITY_RANK: Record<string, number> = { urgent: 3, high: 2, medium: 1, low: 0 };

function sortTasks(tasks: TaskRow[], key: SortKey, dir: 1 | -1) {
  return [...tasks].sort((a, b) => {
    if (key === "title") return dir * a.title.localeCompare(b.title);
    if (key === "dueDate") return dir * (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    if (key === "priority") return dir * ((PRIORITY_RANK[a.priority ?? ""] ?? -1) - (PRIORITY_RANK[b.priority ?? ""] ?? -1));
    return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  });
}

export function TaskListTable({ tasks, showProject = true }: { tasks: TaskRow[]; showProject?: boolean }) {
  const { openTask } = useTaskPanel();
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ label: null, tasks: sortTasks(tasks, sortKey, sortDir) }];
    const map = new Map<string, TaskRow[]>();
    for (const task of tasks) {
      const key = groupBy === "project" ? task.projectName : task.assigneeName ?? "Non assignée";
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, items]) => ({ label, tasks: sortTasks(items, sortKey, sortDir) }));
  }, [tasks, groupBy, sortKey, sortDir]);

  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-3">
        <span className="text-kov-steel text-xs uppercase tracking-widest">Grouper par</span>
        {(["none", "project", "assignee"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setGroupBy(option)}
            className="text-xs uppercase tracking-widest px-2 py-1 transition-colors"
            style={{ color: groupBy === option ? "var(--kov-red)" : "var(--kov-steel)" }}
          >
            {option === "none" ? "Aucun" : option === "project" ? "Projet" : "Assigné"}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState message="Aucune tâche ne correspond à ces filtres." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
                <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort("title")}>
                  Tâche
                </th>
                {showProject && <th className="py-2 pr-4">Projet</th>}
                <th className="py-2 pr-4">Assigné</th>
                <th className="py-2 pr-4">Statut</th>
                <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort("priority")}>
                  Priorité
                </th>
                <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort("dueDate")}>
                  Échéance
                </th>
                <th className="py-2 pr-4">Progression</th>
                <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort("updatedAt")}>
                  Mise à jour
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, groupIndex) => (
                <Fragment key={group.label ?? `group-${groupIndex}`}>
                  {group.label && (
                    <tr>
                      <td colSpan={showProject ? 8 : 7} className="pt-4 pb-1 text-kov-steel text-xs uppercase tracking-widest">
                        {group.label}
                      </td>
                    </tr>
                  )}
                  {group.tasks.map((task) => {
                    const isOverdue = !!task.dueDate && new Date(task.dueDate) < now && task.status !== "done";
                    const progress = task.checklistTotal > 0 ? Math.round((task.checklistDone / task.checklistTotal) * 100) : 0;
                    return (
                      <tr
                        key={task.id}
                        className="border-b cursor-pointer hover:bg-white/[0.02] transition-colors"
                        style={{ borderColor: "var(--kov-border)" }}
                        onClick={() => openTask(task.id)}
                      >
                        <td className="py-3 pr-4 text-kov-bone">{task.title}</td>
                        {showProject && <td className="py-3 pr-4 text-kov-steel">{task.projectName}</td>}
                        <td className="py-3 pr-4 text-kov-steel">{task.assigneeName ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge
                            label={TASK_STATUS_LABELS[task.status as TaskStatus] ?? task.status}
                            tone={task.status === "done" ? "positive" : task.status === "blocked" ? "danger" : "neutral"}
                          />
                        </td>
                        <td className="py-3 pr-4 text-kov-steel">
                          {task.priority ? PRIORITY_LABELS[task.priority as Priority] : "—"}
                        </td>
                        <td className="py-3 pr-4">{task.dueDate ? <DateBadge date={task.dueDate} isOverdue={isOverdue} /> : "—"}</td>
                        <td className="py-3 pr-4 w-28">
                          {task.checklistTotal > 0 ? (
                            <div className="flex items-center gap-2">
                              <ProgressBar percent={progress} />
                              <span className="text-kov-steel text-xs whitespace-nowrap">
                                {task.checklistDone}/{task.checklistTotal}
                              </span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 pr-4 text-kov-steel whitespace-nowrap">{formatRelativeTime(task.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
