"use client";

import { useState } from "react";
import { updateLeadStatus } from "@/app/admin/leads/actions";
import type { LeadStatusRow } from "@/lib/leads/statuses";
import { LeadColumn } from "./LeadColumn";
import type { LeadRow } from "./types";

// Extends the exact TaskBoard/TaskColumn drag-and-drop pattern: native
// HTML5 DnD, optimistic update with rollback on server-action failure.
// Columns are every active lead_statuses row, in position order — since
// statuses are now admin-configurable, the board adapts automatically
// instead of hardcoding which stages get a column.
export function LeadBoard({
  leads,
  setLeads,
  statuses,
}: {
  leads: LeadRow[];
  setLeads: (updater: (prev: LeadRow[]) => LeadRow[]) => void;
  statuses: LeadStatusRow[];
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const activeStatuses = statuses.filter((s) => s.isActive).sort((a, b) => a.position - b.position);

  function handleDrop(status: string) {
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;

    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;

    const previousStatus = lead.status;
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));

    updateLeadStatus(id, status).catch(() => {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: previousStatus } : l)));
    });
  }

  return (
    <div className="grid gap-3 overflow-x-auto pb-2" style={{ gridTemplateColumns: `repeat(${activeStatuses.length}, minmax(220px, 1fr))` }}>
      {activeStatuses.map((status) => (
        <LeadColumn
          key={status.key}
          label={status.label}
          color={status.color}
          leads={leads.filter((l) => l.status === status.key)}
          draggingId={draggingId}
          onDragStart={setDraggingId}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => handleDrop(status.key)}
        />
      ))}
    </div>
  );
}
