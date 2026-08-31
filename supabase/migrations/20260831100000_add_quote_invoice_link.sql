-- Lets a quote be converted into an invoice (admin/quotes "Convertir en
-- facture" action). Nullable, set once — prevents converting the same
-- quote twice and lets the UI link straight from a quote to the invoice
-- it became.
alter table quotes add column invoice_id uuid references invoices (id) on delete set null;

comment on column quotes.invoice_id is
  'Set once this quote has been converted into an invoice — prevents converting the same quote twice and lets the UI link to the resulting invoice.';
