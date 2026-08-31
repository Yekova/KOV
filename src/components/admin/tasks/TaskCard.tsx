"use client";

import { useTaskPanel } from "./TaskPanelContext";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DateBadge } from "@/components/admin/DateBadge";
import { PRIORITY_LABELS, type Priority } from "@/lib/admin/status";
import type { TaskRow } from "./types";

export function TaskCard({ task, dragging, showProject = true }: { task: TaskRow; dragging: boolean; showProject?: boolean }) {
  const { openTask } = useTaskPanel();
  const isOverdue = !!task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openTask(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") openTask(task.id);
      }}
      className="p-3 border cursor-grab active:cursor-grabbing transition-opacity text-left"
      style={{
        borderColor: "var(--kov-border)",
        borderRadius: "var(--radius-sm)",
        background: "var(--kov-graphite)",
        opacity: dragging ? 0.4 : 1,
      }}
    >
      <p className="text-kov-bone text-sm">{task.title}</p>
      {showProject && <p className="text-kov-steel text-xs mt-1 truncate">{task.projectName}</p>}

      {task.checklistTotal > 0 && (
        <p className="text-kov-steel text-xs mt-2">
          {task.checklistDone}/{task.checklistTotal} tâches
        </p>
      )}

      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(task.status === "blocked" || task.status === "client_review") && (
            <StatusBadge
              label={task.status === "blocked" ? "Bloquée" : "Validation client"}
              tone={task.status === "blocked" ? "danger" : "warning"}
            />
          )}
          {task.priority && (task.priority === "urgent" || task.priority === "high") && (
            <StatusBadge label={PRIORITY_LABELS[task.priority as Priority]} tone="danger" />
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.assigneeName && <span className="text-kov-steel text-xs">{task.assigneeName}</span>}
          {task.dueDate && <DateBadge date={task.dueDate} isOverdue={isOverdue} />}
        </div>
      </div>
    </div>
  );
}
