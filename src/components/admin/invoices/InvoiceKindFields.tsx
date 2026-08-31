"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

const KIND_OPTIONS = [
  { value: "full", label: "Facture unique" },
  { value: "deposit", label: "Facture d'acompte" },
  { value: "balance", label: "Facture de solde" },
];

export function InvoiceKindFields() {
  const [kind, setKind] = useState("full");

  return (
    <>
      <label className="text-xs text-kov-steel">
        Type
        <Select name="kind" value={kind} onChange={setKind} options={KIND_OPTIONS} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
      </label>
      {kind !== "full" && (
        <>
          {kind === "deposit" && (
            <label className="text-xs text-kov-steel">
              Acompte (%)
              <input type="number" name="deposit_percent" min={1} max={100} placeholder="30" className={`${FIELD_CLASS} w-24`} style={{ borderColor: "var(--kov-border)" }} />
            </label>
          )}
          <label className="text-xs text-kov-steel">
            Montant total projet (€)
            <input type="text" name="total_project_eur" placeholder="4200.00" className={`${FIELD_CLASS} w-32`} style={{ borderColor: "var(--kov-border)" }} />
          </label>
        </>
      )}
    </>
  );
}
