"use client";

import { useActionState } from "react";
import { createInvoice } from "@/app/admin/clients/actions";
import { Button } from "@/components/ui/Button";
import { InvoiceKindFields } from "@/components/admin/invoices/InvoiceKindFields";
import { InvoiceLineItemsField } from "@/components/admin/invoices/InvoiceLineItemsField";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

const INITIAL_STATE: { error: string | null } = { error: null };

async function action(_prevState: { error: string | null }, formData: FormData) {
  return createInvoice(formData);
}

export function NewClientInvoiceForm({ clientId }: { clientId: string }) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="border p-4 flex flex-wrap items-end gap-4"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
    >
      <input type="hidden" name="client_id" value={clientId} />
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
        PDF personnalisé (facultatif — sinon généré automatiquement)
        <input type="file" name="pdf_file" accept="application/pdf" className={`${FIELD_CLASS} py-1.5`} style={{ borderColor: "var(--kov-border)" }} />
      </label>
      <InvoiceLineItemsField />
      {state.error && <p className="text-kov-red text-xs w-full">{state.error}</p>}
      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Création…" : "Créer la facture"}
      </Button>
    </form>
  );
}
