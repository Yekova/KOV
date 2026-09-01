"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const FIELD_CLASS =
  "bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

interface Row {
  description: string;
  quantity: string;
  unitPriceEur: string;
}

const EMPTY_ROW: Row = { description: "", quantity: "1", unitPriceEur: "" };

// Optional itemized breakdown for an invoice — unlike quotes, zero rows is a
// valid, common case (most invoices are still a single lump-sum amount), so
// this starts empty rather than with one required row.
export function InvoiceLineItemsField() {
  const [rows, setRows] = useState<Row[]>([]);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="w-full space-y-2">
      <input type="hidden" name="line_items" value={JSON.stringify(rows.filter((r) => r.description.trim()))} />
      <p className="text-xs text-kov-steel">Détail des prestations (facultatif)</p>
      {rows.map((row, index) => (
        <div key={index} className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-kov-steel flex-1 min-w-[180px]">
            Description
            <input
              type="text"
              value={row.description}
              onChange={(e) => updateRow(index, { description: e.target.value })}
              className={`${FIELD_CLASS} w-full`}
              style={{ borderColor: "var(--kov-border)" }}
            />
          </label>
          <label className="text-xs text-kov-steel">
            Qté
            <input
              type="text"
              value={row.quantity}
              onChange={(e) => updateRow(index, { quantity: e.target.value })}
              className={`${FIELD_CLASS} w-16`}
              style={{ borderColor: "var(--kov-border)" }}
            />
          </label>
          <label className="text-xs text-kov-steel">
            Prix unitaire (€)
            <input
              type="text"
              value={row.unitPriceEur}
              onChange={(e) => updateRow(index, { unitPriceEur: e.target.value })}
              className={`${FIELD_CLASS} w-28`}
              style={{ borderColor: "var(--kov-border)" }}
            />
          </label>
          <Button type="button" variant="ghost" onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}>
            Retirer
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" onClick={() => setRows((prev) => [...prev, { ...EMPTY_ROW }])}>
        + Ajouter une ligne
      </Button>
    </div>
  );
}
