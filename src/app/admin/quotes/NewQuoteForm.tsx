"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createQuote } from "./actions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

interface LineItemRow {
  description: string;
  quantity: string;
  unitPriceEur: string;
}

const EMPTY_ROW: LineItemRow = { description: "", quantity: "1", unitPriceEur: "" };

export function NewQuoteForm({
  clients,
  leads,
  onSuccess,
}: {
  clients: { id: string; label: string }[];
  leads: { id: string; label: string; email: string }[];
  onSuccess?: () => void;
}) {
  const [rows, setRows] = useState<LineItemRow[]>([{ ...EMPTY_ROW }]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const subtotalCents = rows.reduce((sum, row) => {
    const qty = parseFloat(row.quantity.replace(",", "."));
    const price = parseFloat(row.unitPriceEur.replace(",", "."));
    return sum + (Number.isFinite(qty) && Number.isFinite(price) ? qty * price * 100 : 0);
  }, 0);

  function updateRow(index: number, patch: Partial<LineItemRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("line_items", JSON.stringify(rows));

    startTransition(async () => {
      try {
        const result = await createQuote(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        setRows([{ ...EMPTY_ROW }]);
        form.reset();
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "La création du devis a échoué.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border p-4 space-y-4"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
    >
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-xs text-kov-steel">
          Référence
          <input type="text" name="reference" required placeholder="D-2026-01" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          Destinataire
          <input type="text" name="recipient_name" required placeholder="Nom" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          Email destinataire
          <input type="email" name="recipient_email" placeholder="contact@..." className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          Client existant (facultatif)
          <Select
            name="client_id"
            defaultValue=""
            options={[{ value: "", label: "— Aucun —" }, ...clients.map((c) => ({ value: c.id, label: c.label }))]}
            className={FIELD_CLASS}
            style={{ borderColor: "var(--kov-border)" }}
          />
        </label>
        <label className="text-xs text-kov-steel">
          Lead (facultatif)
          <Select
            name="lead_id"
            defaultValue=""
            options={[{ value: "", label: "— Aucun —" }, ...leads.map((l) => ({ value: l.id, label: l.label }))]}
            className={FIELD_CLASS}
            style={{ borderColor: "var(--kov-border)" }}
          />
        </label>
        <label className="text-xs text-kov-steel">
          Valable jusqu&apos;au
          <input type="date" name="valid_until" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          PDF personnalisé (facultatif — sinon généré automatiquement)
          <input type="file" name="pdf_file" accept="application/pdf" className={`${FIELD_CLASS} py-1.5`} style={{ borderColor: "var(--kov-border)" }} />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-kov-steel">Prestations</p>
        {rows.map((row, index) => (
          <div key={index} className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-kov-steel flex-1 min-w-[220px]">
              Description
              <input
                type="text"
                required
                value={row.description}
                onChange={(e) => updateRow(index, { description: e.target.value })}
                className={FIELD_CLASS}
                style={{ borderColor: "var(--kov-border)" }}
              />
            </label>
            <label className="text-xs text-kov-steel">
              Qté
              <input
                type="text"
                required
                value={row.quantity}
                onChange={(e) => updateRow(index, { quantity: e.target.value })}
                className={`${FIELD_CLASS} w-20`}
                style={{ borderColor: "var(--kov-border)" }}
              />
            </label>
            <label className="text-xs text-kov-steel">
              Prix unitaire (€)
              <input
                type="text"
                required
                placeholder="500.00"
                value={row.unitPriceEur}
                onChange={(e) => updateRow(index, { unitPriceEur: e.target.value })}
                className={`${FIELD_CLASS} w-32`}
                style={{ borderColor: "var(--kov-border)" }}
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              disabled={rows.length === 1}
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
            >
              Retirer
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={() => setRows((prev) => [...prev, { ...EMPTY_ROW }])}>
          + Ajouter une ligne
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="text-xs text-kov-steel">
          Remise (€)
          <input type="text" name="discount_eur" placeholder="0.00" className={`${FIELD_CLASS} w-32`} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <p className="text-kov-bone text-sm">Sous-total : {(subtotalCents / 100).toFixed(2)} €</p>
      </div>

      {error && <p className="text-kov-red text-xs">{error}</p>}

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Génération du PDF…" : "Créer le devis"}
      </Button>
    </form>
  );
}
