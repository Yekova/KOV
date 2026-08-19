"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "./actions";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/admin/status";

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
      {LEAD_STATUSES.map((value) => (
        <option key={value} value={value} className="bg-kov-black">
          {LEAD_STATUS_LABELS[value]}
        </option>
      ))}
    </select>
  );
}
