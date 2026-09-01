"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { DateBadge } from "@/components/admin/DateBadge";
import { Avatar } from "@/components/admin/Avatar";
import { PRIORITY_LABELS, PRIORITY_COLORS, type Priority } from "@/lib/admin/status";
import { useTaskPanel } from "@/components/admin/tasks/TaskPanelContext";

export type TaskFeedItem = {
  id: string;
  title: string;
  projectName: string;
  assigneeName: string | null;
  priority: string | null;
  dueDate: string | null;
};

export function TaskFeed({ tasks }: { tasks: TaskFeedItem[] }) {
  const { openTask } = useTaskPanel();

  return (
    <GlassCard className="p-5">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Tâches à priorité</p>

      {tasks.length === 0 ? (
        <EmptyState message="Aucune tâche en attente." />
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => {
            const isOverdue = !!task.dueDate && new Date(task.dueDate) < new Date();
            return (
              <li key={task.id}>
                <button type="button" onClick={() => openTask(task.id)} className="flex items-start gap-3 w-full text-left group">
                  <span
                    className="w-4 h-4 mt-0.5 shrink-0 border"
                    style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-kov-bone text-sm group-hover:text-kov-red transition-colors truncate">{task.title}</p>
                    <p className="text-kov-steel text-xs mt-0.5 truncate">{task.projectName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.priority && (
                      <span
                        className="text-[10px] uppercase tracking-widest px-2 py-1 border"
                        style={{
                          color: PRIORITY_COLORS[task.priority as Priority],
                          borderColor: PRIORITY_COLORS[task.priority as Priority],
                          borderRadius: "var(--radius-pill)",
                        }}
                      >
                        {PRIORITY_LABELS[task.priority as Priority] ?? task.priority}
                      </span>
                    )}
                    {task.assigneeName && <Avatar name={task.assigneeName} />}
                    {task.dueDate && <DateBadge date={task.dueDate} isOverdue={isOverdue} />}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
