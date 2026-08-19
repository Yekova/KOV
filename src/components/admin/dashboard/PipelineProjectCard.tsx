export type PipelineProject = {
  id: string;
  name: string;
  category: string;
  budgetCents: number | null;
  currency: string;
  pipelineStage: string;
  clientName: string;
};

export function PipelineProjectCard({ project, dragging }: { project: PipelineProject; dragging: boolean }) {
  return (
    <div
      className="p-3 border cursor-grab active:cursor-grabbing transition-opacity"
      style={{
        borderColor: "var(--kov-border)",
        borderRadius: "var(--radius-sm)",
        background: "var(--kov-graphite)",
        opacity: dragging ? 0.4 : 1,
      }}
    >
      <p className="text-kov-bone text-sm truncate">{project.name}</p>
      <p className="text-kov-steel text-xs mt-1 truncate">{project.clientName}</p>
      {project.budgetCents !== null && (
        <p className="text-kov-red text-xs mt-2">
          {(project.budgetCents / 100).toLocaleString("fr-FR")} {project.currency}
        </p>
      )}
    </div>
  );
}
