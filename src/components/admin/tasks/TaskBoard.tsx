"use client";

import { useState } from "react";
import { moveTask } from "@/app/admin/tasks/actions";
import { TASK_KANBAN_STATUSES, TASK_STATUS_LABELS, type TaskStatus } from "@/lib/admin/status";
import { TaskColumn } from "./TaskColumn";
import type { TaskRow } from "./types";

// Extends the exact ProjectPipeline/PipelineColumn drag-and-drop pattern:
// native HTML5 DnD, optimistic update with rollback on server-action
// failure. Column-level moves only (append at the end of the target
// column) — no intra-column drag-to-reorder, matching the same scope
// ProjectPipeline itself keeps.
export function TaskBoard({ tasks, setTasks }: { tasks: TaskRow[]; setTasks: (updater: (prev: TaskRow[]) => TaskRow[]) => void }) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDrop(status: TaskStatus) {
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;

    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;

    const previousStatus = task.status;
    const previousPosition = task.position;
    const nextPosition = tasks.filter((t) => t.status === status).length;

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status, position: nextPosition } : t)));

    moveTask(id, status, nextPosition).catch(() => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: previousStatus, position: previousPosition } : t)));
    });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {TASK_KANBAN_STATUSES.map((status) => (
        <TaskColumn
          key={status}
          label={TASK_STATUS_LABELS[status]}
          tasks={tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position)}
          draggingId={draggingId}
          onDragStart={setDraggingId}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => handleDrop(status)}
        />
      ))}
    </div>
  );
}
