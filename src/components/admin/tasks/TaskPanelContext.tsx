"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { TaskDetailPanel } from "./TaskDetailPanel";

type TaskPanelContextValue = { openTask: (id: string) => void };

const TaskPanelContext = createContext<TaskPanelContextValue | null>(null);

// Mounted once in the admin layout so any task card/row anywhere (Kanban,
// list, dashboard TaskFeed, project tab) can open the same detail panel via
// useTaskPanel().openTask(id) without prop-drilling — the panel itself
// fetches its own data (getTaskDetail) rather than needing the full task
// record passed down from wherever it was opened.
export function TaskPanelProvider({ children }: { children: ReactNode }) {
  const [taskId, setTaskId] = useState<string | null>(null);

  return (
    <TaskPanelContext.Provider value={{ openTask: setTaskId }}>
      {children}
      {taskId && <TaskDetailPanel taskId={taskId} onClose={() => setTaskId(null)} />}
    </TaskPanelContext.Provider>
  );
}

export function useTaskPanel() {
  const ctx = useContext(TaskPanelContext);
  if (!ctx) throw new Error("useTaskPanel must be used within a TaskPanelProvider.");
  return ctx;
}
