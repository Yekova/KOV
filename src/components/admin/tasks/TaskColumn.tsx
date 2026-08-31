import { TaskCard } from "./TaskCard";
import type { TaskRow } from "./types";

export function TaskColumn({
  label,
  tasks,
  draggingId,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  label: string;
  tasks: TaskRow[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: () => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex flex-col gap-3 p-3 border min-w-0"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-lg)", background: "var(--kov-carbon)" }}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-kov-steel">
        <span>{label}</span>
        <span>{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-kov-steel text-xs py-4 text-center">—</p>
      ) : (
        tasks.map((task) => (
          <div key={task.id} draggable onDragStart={() => onDragStart(task.id)}>
            <TaskCard task={task} dragging={draggingId === task.id} />
          </div>
        ))
      )}
    </div>
  );
}
