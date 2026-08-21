// Shared shape for quotes.line_items and invoices.line_items — both store
// the same {description, quantity, unit_price_cents} structure (see
// 20260821130000_add_invoice_kind_and_quotes.sql and
// 20260822160000_add_invoice_line_items.sql). Kept generic here (not tied to
// QuoteDocument's QuoteLineItem type) so InvoiceDocument can reuse it too.
export interface LineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

// DB stores line items as {description, quantity, unit_price_cents} (snake_case)
// — the PDF/email layer uses camelCase, so every read/write through this
// boundary converts. Lives outside actions.ts because a "use server" file
// may only export async functions.
export function toDbLineItems(items: LineItem[]) {
  return items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price_cents: item.unitPriceCents,
  }));
}

export function fromDbLineItems(raw: unknown): LineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    description: typeof item.description === "string" ? item.description : "",
    quantity: typeof item.quantity === "number" ? item.quantity : 0,
    unitPriceCents: typeof item.unit_price_cents === "number" ? item.unit_price_cents : 0,
  }));
}

// Shared client-form parsing: both the quotes and invoices "new" forms send
// line items as a JSON string of {description, quantity, unitPriceEur}
// (euros, matching the form's user-facing inputs) in a hidden field.
export function parseLineItemsFromForm(raw: FormDataEntryValue | null): LineItem[] {
  if (typeof raw !== "string" || !raw.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Lignes invalides.");
  }
  if (!Array.isArray(parsed)) throw new Error("Lignes invalides.");

  return parsed.map((item): LineItem => {
    const description = typeof item?.description === "string" ? item.description.trim() : "";
    const quantity = Number(item?.quantity);
    const unitPriceCents = Math.round(Number(item?.unitPriceEur) * 100);
    if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPriceCents) || unitPriceCents < 0) {
      throw new Error("Lignes invalides.");
    }
    return { description, quantity, unitPriceCents };
  });
}
