"use client";

import { useTransition } from "react";
import { updateQuoteStatus } from "./actions";
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from "@/lib/portal/status";

export function QuoteStatusSelect({ quoteId, status }: { quoteId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(() => {
          updateQuoteStatus(quoteId, next);
        });
      }}
      className="bg-transparent border text-kov-bone text-xs uppercase tracking-widest px-3 py-2 focus:outline-none focus:border-kov-red disabled:opacity-50"
      style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
    >
      {QUOTE_STATUSES.map((value) => (
        <option key={value} value={value} className="bg-kov-black">
          {QUOTE_STATUS_LABELS[value]}
        </option>
      ))}
    </select>
  );
}
