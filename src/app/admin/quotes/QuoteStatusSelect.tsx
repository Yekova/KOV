"use client";

import { useState, useTransition } from "react";
import { updateQuoteStatus } from "./actions";
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from "@/lib/portal/status";
import { Select } from "@/components/ui/Select";

export function QuoteStatusSelect({ quoteId, status }: { quoteId: string; status: string }) {
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
              await updateQuoteStatus(quoteId, next);
            } catch (err) {
              setError(err instanceof Error ? err.message : "La mise à jour a échoué.");
            }
          });
        }}
        options={QUOTE_STATUSES.map((value) => ({ value, label: QUOTE_STATUS_LABELS[value] }))}
        className="bg-transparent border text-kov-bone text-xs uppercase tracking-widest px-3 py-2 focus:outline-none disabled:opacity-50"
        style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
      />
      {error && <p className="text-kov-red text-xs mt-1">{error}</p>}
    </div>
  );
}
