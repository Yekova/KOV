"use client";

import { useState, useTransition } from "react";
import { sendInvoiceEmail, downloadInvoicePdf, deleteInvoice } from "@/app/admin/clients/actions";
import { Button } from "@/components/ui/Button";

export function InvoiceRowActions({
  invoiceId,
  hasPdf,
  status,
  reference,
}: {
  invoiceId: string;
  hasPdf: boolean;
  status: string;
  reference: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
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
      {status !== "paid" && (
        <Button
          type="button"
          variant="ghost"
          disabled={isDeleting}
          onClick={() => {
            if (!window.confirm(`Supprimer définitivement la facture ${reference} ?`)) return;
            setError(null);
            startDeleting(async () => {
              try {
                await deleteInvoice(invoiceId);
              } catch (err) {
                setError(err instanceof Error ? err.message : "La suppression a échoué.");
              }
            });
          }}
        >
          <span className="text-kov-red">{isDeleting ? "Suppression…" : "Supprimer"}</span>
        </Button>
      )}
      {error && <span className="text-kov-red text-xs">{error}</span>}
    </div>
  );
}
