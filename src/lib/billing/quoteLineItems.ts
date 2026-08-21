import type { QuoteLineItem } from "./QuoteDocument";

// DB stores line items as {description, quantity, unit_price_cents} (snake_case,
// see 20260821130000_add_invoice_kind_and_quotes.sql) — the PDF/email layer uses
// camelCase QuoteLineItem, so every read/write through this boundary converts.
// Lives outside actions.ts because a "use server" file may only export async
// functions.
export function toDbLineItems(items: QuoteLineItem[]) {
  return items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price_cents: item.unitPriceCents,
  }));
}

export function fromDbLineItems(raw: unknown): QuoteLineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    description: typeof item.description === "string" ? item.description : "",
    quantity: typeof item.quantity === "number" ? item.quantity : 0,
    unitPriceCents: typeof item.unit_price_cents === "number" ? item.unit_price_cents : 0,
  }));
}
