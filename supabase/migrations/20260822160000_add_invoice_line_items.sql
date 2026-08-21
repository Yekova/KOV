-- Optional itemized breakdown, same shape as quotes.line_items (see
-- 20260821130000_add_invoice_kind_and_quotes.sql). Purely additive display
-- detail: amount_cents remains the authoritative amount due, entered
-- directly by the admin — line items don't drive it, so deposit/balance
-- kind math (which already depends on amount_cents) is untouched. An empty
-- array (the default) means "no breakdown", falling back to the existing
-- single "Prestation KOV" line on the PDF.
alter table invoices add column line_items jsonb not null default '[]';

comment on column invoices.line_items is
  'Optional itemized breakdown — array of {description, quantity, unit_price_cents}, purely for PDF/email display. Does not drive amount_cents.';
