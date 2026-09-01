import { LeadCard } from "./LeadCard";
import type { LeadRow } from "./types";

export function LeadColumn({
  label,
  color,
  leads,
  draggingId,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  label: string;
  color: string;
  leads: LeadRow[];
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
        <span className="inline-flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 shrink-0" style={{ background: color, borderRadius: "var(--radius-pill)" }} />
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0">{leads.length}</span>
      </div>

      {leads.length === 0 ? (
        <p className="text-kov-steel text-xs py-4 text-center">—</p>
      ) : (
        leads.map((lead) => (
          <div key={lead.id} draggable onDragStart={() => onDragStart(lead.id)}>
            <LeadCard lead={lead} dragging={draggingId === lead.id} />
          </div>
        ))
      )}
    </div>
  );
}
