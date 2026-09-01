"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createInvoice } from "@/app/admin/clients/actions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { InvoiceKindFields } from "@/components/admin/invoices/InvoiceKindFields";
import { InvoiceLineItemsField } from "@/components/admin/invoices/InvoiceLineItemsField";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export function NewInvoiceForm({
  clients,
  onSuccess,
}: {
  clients: { id: string; label: string }[];
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const result = await createInvoice(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        form.reset();
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "La création de la facture a échoué.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-xs text-kov-steel min-w-[200px]">
          Client
          <Select
            name="client_id"
            defaultValue=""
            placeholder="Choisir un client…"
            options={clients.map((c) => ({ value: c.id, label: c.label }))}
            className={FIELD_CLASS}
            style={{ borderColor: "var(--kov-border)" }}
          />
        </label>
        <label className="text-xs text-kov-steel">
          Référence
          <input type="text" name="reference" required placeholder="F-2026-01" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          Montant (€)
          <input type="text" name="amount_eur" required placeholder="1200.00" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          Échéance
          <input type="date" name="due_at" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <InvoiceKindFields />
        <label className="text-xs text-kov-steel">
          PDF personnalisé (facultatif)
          <input type="file" name="pdf_file" accept="application/pdf" className={`${FIELD_CLASS} py-1.5`} style={{ borderColor: "var(--kov-border)" }} />
        </label>
      </div>

      <InvoiceLineItemsField />

      {error && <p className="text-kov-red text-xs">{error}</p>}

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Création…" : "Créer la facture"}
      </Button>
    </form>
  );
}
