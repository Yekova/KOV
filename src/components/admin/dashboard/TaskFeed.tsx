"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PRIORITY_LABELS, type Priority } from "@/lib/admin/status";
import { useTaskPanel } from "@/components/admin/tasks/TaskPanelContext";

export type TaskFeedItem = {
  id: string;
  title: string;
  assigneeName: string | null;
  priority: string | null;
};

export function TaskFeed({ tasks }: { tasks: TaskFeedItem[] }) {
  const { openTask } = useTaskPanel();

  return (
    <GlassCard className="p-5">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Tâches / Approbations</p>

      {tasks.length === 0 ? (
        <EmptyState message="Aucune tâche en attente." />
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task.id}>
              <button type="button" onClick={() => openTask(task.id)} className="flex items-start gap-3 w-full text-left group">
                <span
                  className="w-4 h-4 mt-0.5 shrink-0 border"
                  style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-kov-bone text-sm group-hover:text-kov-red transition-colors">{task.title}</p>
                  <p className="text-kov-steel text-xs mt-0.5">
                    En attente de {task.assigneeName || "l'équipe"}
                  </p>
                </div>
                {task.priority && (
                  <StatusBadge
                    label={PRIORITY_LABELS[task.priority as Priority] ?? task.priority}
                    tone={task.priority === "high" || task.priority === "urgent" ? "danger" : "neutral"}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
