"use client";

import { useState, useTransition } from "react";
import { assignLead } from "./actions";

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
      <select
        defaultValue={assignedTo ?? ""}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value;
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
        className="bg-transparent border text-kov-bone text-xs px-3 py-2 focus:outline-none focus:border-kov-red disabled:opacity-50"
        style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
      >
        <option value="" className="bg-kov-black">
          — Non assigné —
        </option>
        {admins.map((a) => (
          <option key={a.id} value={a.id} className="bg-kov-black">
            {a.label}
          </option>
        ))}
      </select>
      {error && <p className="text-kov-red text-xs mt-1">{error}</p>}
    </div>
  );
}
