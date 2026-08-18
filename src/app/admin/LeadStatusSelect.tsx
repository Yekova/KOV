"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  won: "Gagné",
  lost: "Perdu",
};

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(() => {
          updateLeadStatus(leadId, next);
        });
      }}
      className="bg-transparent border text-kov-bone text-xs uppercase tracking-widest px-3 py-2 focus:outline-none focus:border-kov-red disabled:opacity-50"
      style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
    >
      {Object.entries(STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value} className="bg-kov-black">
          {label}
        </option>
      ))}
    </select>
  );
}
