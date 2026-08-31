"use client";

import { useState } from "react";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export function InvoiceKindFields() {
  const [kind, setKind] = useState("full");

  return (
    <>
      <label className="text-xs text-kov-steel">
        Type
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className={FIELD_CLASS}
          style={{ borderColor: "var(--kov-border)" }}
        >
          <option value="full">Facture unique</option>
          <option value="deposit">Facture d&apos;acompte</option>
          <option value="balance">Facture de solde</option>
        </select>
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
