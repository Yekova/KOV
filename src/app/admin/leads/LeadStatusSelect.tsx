"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus } from "./actions";
import { Select } from "@/components/ui/Select";
import type { LeadStatusRow } from "@/lib/leads/statuses";

const TRIGGER_CLASS = "bg-transparent border text-xs uppercase tracking-widest px-3 py-2 focus:outline-none disabled:opacity-50";

export function LeadStatusSelect({ leadId, status, statuses }: { leadId: string; status: string; statuses: LeadStatusRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const color = statuses.find((s) => s.key === status)?.color ?? "var(--kov-steel)";

  return (
    <div>
      <Select
        value={status}
        disabled={isPending}
        onChange={(next) => {
          setError(null);
          startTransition(async () => {
            try {
              await updateLeadStatus(leadId, next);
            } catch (err) {
              setError(err instanceof Error ? err.message : "La mise à jour a échoué.");
            }
          });
        }}
        options={statuses.filter((s) => s.isActive || s.key === status).map((s) => ({ value: s.key, label: s.label }))}
        className={TRIGGER_CLASS}
        style={{ borderRadius: "var(--radius-sm)", borderColor: color, color }}
      />
      {error && <p className="text-kov-red text-xs mt-1">{error}</p>}
    </div>
  );
}
