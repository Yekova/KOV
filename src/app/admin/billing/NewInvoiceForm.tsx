"use client";

import { type FormEvent } from "react";
import { createInvoice } from "@/app/admin/clients/actions";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { useKovAction } from "@/lib/useKovAction";
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
  const action = useKovAction({
    success: "Facture créée.",
    fallbackError: "La création de la facture a échoué.",
    onSuccess,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    action.run(async () => {
      // createInvoice RENVOIE son erreur : sans la relever, le cycle
      // conclurait à un succès et le bouton afficherait un check.
      const result = await createInvoice(formData);
      if (result.error) throw new Error(result.error);
      form.reset();
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
          {/* Attribuée par la base : la numérotation des factures doit
              rester continue, et un numéro tapé de mémoire ne le garantit
              pas. Le champ reste ouvert pour reprendre un historique. */}
          <input type="text" name="reference" placeholder="Automatique" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
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

      {action.error && (
        <p role="alert" className="text-kov-red text-xs">
          {action.error}
        </p>
      )}

      <KovActionButton state={action.state} onStateSettled={action.reset} successLabel="Créée">
        Créer la facture
      </KovActionButton>
    </form>
  );
}
