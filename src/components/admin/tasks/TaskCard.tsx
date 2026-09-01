"use client";

import { useTaskPanel } from "./TaskPanelContext";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DateBadge } from "@/components/admin/DateBadge";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { Avatar } from "@/components/admin/Avatar";
import { PRIORITY_LABELS, PRIORITY_COLORS, type Priority } from "@/lib/admin/status";
import type { TaskRow } from "./types";

export function TaskCard({ task, dragging, showProject = true }: { task: TaskRow; dragging: boolean; showProject?: boolean }) {
  const { openTask } = useTaskPanel();
  const isOverdue = !!task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const checklistProgress = task.checklistTotal > 0 ? Math.round((task.checklistDone / task.checklistTotal) * 100) : null;

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

      {checklistProgress !== null && (
        <div className="flex items-center gap-2 mt-2">
          <ProgressBar percent={checklistProgress} className="flex-1" />
          <span className="text-kov-steel text-[10px] whitespace-nowrap">
            {task.checklistDone}/{task.checklistTotal}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(task.status === "blocked" || task.status === "client_review") && (
            <StatusBadge
              label={task.status === "blocked" ? "Bloquée" : "Validation client"}
              tone={task.status === "blocked" ? "danger" : "warning"}
            />
          )}
          {task.priority && (
            <span
              className="inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-widest border"
              style={{
                color: PRIORITY_COLORS[task.priority as Priority],
                borderColor: PRIORITY_COLORS[task.priority as Priority],
                borderRadius: "var(--radius-pill)",
              }}
            >
              {PRIORITY_LABELS[task.priority as Priority]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.assigneeName && <Avatar name={task.assigneeName} />}
          {task.dueDate && <DateBadge date={task.dueDate} isOverdue={isOverdue} />}
        </div>
      </div>
    </div>
  );
}
