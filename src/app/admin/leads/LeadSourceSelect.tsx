"use client";

import { useState, useTransition } from "react";
import { updateLeadSource } from "./actions";
import { LEAD_SOURCES, LEAD_SOURCE_LABELS, normalizeLeadSource } from "@/lib/admin/status";
import { Select } from "@/components/ui/Select";

const TRIGGER_CLASS = "bg-transparent border text-kov-bone text-xs px-3 py-2 focus:outline-none disabled:opacity-50";

export function LeadSourceSelect({ leadId, source }: { leadId: string; source: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Select
        value={normalizeLeadSource(source)}
        disabled={isPending}
        onChange={(next) => {
          setError(null);
          startTransition(async () => {
            try {
              await updateLeadSource(leadId, next);
            } catch (err) {
              setError(err instanceof Error ? err.message : "La mise à jour a échoué.");
            }
          });
        }}
        options={LEAD_SOURCES.map((value) => ({ value, label: LEAD_SOURCE_LABELS[value] }))}
        className={TRIGGER_CLASS}
        style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
      />
      {error && <p className="text-kov-red text-xs mt-1">{error}</p>}
    </div>
  );
}
