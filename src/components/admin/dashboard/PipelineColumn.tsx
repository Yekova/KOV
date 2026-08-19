import { PipelineProjectCard, type PipelineProject } from "./PipelineProjectCard";

export function PipelineColumn({
  label,
  projects,
  draggingId,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  label: string;
  projects: PipelineProject[];
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
        <span>{projects.length}</span>
      </div>

      {projects.length === 0 ? (
        <p className="text-kov-steel text-xs py-4 text-center">—</p>
      ) : (
        projects.map((project) => (
          <div key={project.id} draggable onDragStart={() => onDragStart(project.id)}>
            <PipelineProjectCard project={project} dragging={draggingId === project.id} />
          </div>
        ))
      )}
    </div>
  );
}
