"use client";

import { useState, useTransition } from "react";
import { updateInvoiceStatus } from "@/app/admin/clients/actions";
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/lib/portal/status";
import { Select } from "@/components/ui/Select";

export function InvoiceStatusSelect({ invoiceId, status }: { invoiceId: string; status: string }) {
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
              const formData = new FormData();
              formData.set("status", next as InvoiceStatus);
              await updateInvoiceStatus(invoiceId, formData);
            } catch (err) {
              setError(err instanceof Error ? err.message : "La mise à jour a échoué.");
            }
          });
        }}
        options={INVOICE_STATUSES.map((s) => ({ value: s, label: INVOICE_STATUS_LABELS[s] }))}
        className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none disabled:opacity-50 w-40"
        style={{ borderColor: "var(--kov-border)" }}
      />
      {error && <p className="text-kov-red text-xs mt-1">{error}</p>}
    </div>
  );
}
