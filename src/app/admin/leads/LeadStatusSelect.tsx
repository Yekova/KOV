"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus } from "./actions";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/admin/status";
import { Select } from "@/components/ui/Select";

const TRIGGER_CLASS = "bg-transparent border text-kov-bone text-xs uppercase tracking-widest px-3 py-2 focus:outline-none disabled:opacity-50";

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
        options={LEAD_STATUSES.map((value) => ({ value, label: LEAD_STATUS_LABELS[value] }))}
        className={TRIGGER_CLASS}
        style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
      />
      {error && <p className="text-kov-red text-xs mt-1">{error}</p>}
    </div>
  );
}
