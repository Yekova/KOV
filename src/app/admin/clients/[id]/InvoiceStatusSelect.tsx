"use client";

import { useState, useTransition } from "react";
import { updateInvoiceStatus } from "../actions";
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/lib/portal/status";

const FIELD_CLASS =
  "bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors disabled:opacity-50";

export function InvoiceStatusSelect({ invoiceId, status }: { invoiceId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <select
        defaultValue={status}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value as InvoiceStatus;
          setError(null);
          startTransition(async () => {
            try {
              const formData = new FormData();
              formData.set("status", next);
              await updateInvoiceStatus(invoiceId, formData);
            } catch (err) {
              setError(err instanceof Error ? err.message : "La mise à jour a échoué.");
            }
          });
        }}
        className={`${FIELD_CLASS} w-40`}
        style={{ borderColor: "var(--kov-border)" }}
      >
        {INVOICE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {INVOICE_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && <p className="text-kov-red text-xs mt-1">{error}</p>}
    </div>
  );
}
