"use client";

import { useState, useTransition } from "react";
import { sendInvoiceEmail, downloadInvoicePdf } from "../actions";
import { Button } from "@/components/ui/Button";

export function InvoiceRowActions({ invoiceId, hasPdf }: { invoiceId: string; hasPdf: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {hasPdf && (
        <form action={downloadInvoicePdf}>
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <Button type="submit" variant="ghost">
            PDF →
          </Button>
        </form>
      )}
      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await sendInvoiceEmail(invoiceId);
              setSent(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "L'envoi a échoué.");
            }
          });
        }}
      >
        {isPending ? "Envoi…" : sent ? "Envoyé ✓" : "Envoyer par email"}
      </Button>
      {error && <span className="text-kov-red text-xs">{error}</span>}
    </div>
  );
}
