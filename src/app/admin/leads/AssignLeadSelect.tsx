"use client";

import { useState, useTransition } from "react";
import { assignLead } from "./actions";
import { Select } from "@/components/ui/Select";

const UNASSIGNED = "";

export function AssignLeadSelect({
  leadId,
  assignedTo,
  admins,
}: {
  leadId: string;
  assignedTo: string | null;
  admins: { id: string; label: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Select
        value={assignedTo ?? UNASSIGNED}
        disabled={isPending}
        onChange={(next) => {
          setError(null);
          startTransition(async () => {
            try {
              const formData = new FormData();
              formData.set("assigned_to", next);
              await assignLead(leadId, formData);
            } catch (err) {
              setError(err instanceof Error ? err.message : "L'attribution a échoué.");
            }
          });
        }}
        options={[{ value: UNASSIGNED, label: "— Non assigné —" }, ...admins.map((a) => ({ value: a.id, label: a.label }))]}
        className="bg-transparent border text-kov-bone text-xs px-3 py-2 focus:outline-none disabled:opacity-50"
        style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
      />
      {error && <p className="text-kov-red text-xs mt-1">{error}</p>}
    </div>
  );
}
