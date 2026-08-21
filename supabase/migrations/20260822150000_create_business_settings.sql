-- Single-row settings table — the legal/financial identity used on every
-- invoice, devis, and email footer. Previously hardcoded in
-- src/lib/billing/businessInfo.ts; seeded here with those same real,
-- verified values (see that file's history) so behavior doesn't change
-- until an admin actually edits something in /admin/settings.
create table business_settings (
  id boolean primary key default true check (id),
  legal_name text not null,
  commercial_name text not null,
  legal_form text not null,
  address_street text not null,
  address_postal_code text not null,
  address_city text not null,
  address_country text not null,
  siret text not null,
  siren text not null,
  ape_code text not null,
  vat_mention text not null,
  iban text not null,
  bic text not null default '',
  payment_terms_days integer not null default 30,
  late_payment_mention text not null,
  updated_at timestamptz not null default now()
);

comment on table business_settings is
  'Single row (id is always true) — admin-editable legal/business identity used on invoices, devis, and email footers. See /admin/settings.';

insert into business_settings (
  legal_name, commercial_name, legal_form,
  address_street, address_postal_code, address_city, address_country,
  siret, siren, ape_code, vat_mention, iban, bic,
  payment_terms_days, late_payment_mention
) values (
  'Mattéo Delorme', 'KOV', 'Entreprise individuelle',
  '49 rue André Maginot', '33000', 'Bordeaux', 'France',
  '941 801 391 00017', '941 801 391', '62.01Z',
  'TVA non applicable, art. 293 B du CGI',
  'FR76 2823 3000 0175 2849 2704 095', '',
  30,
  'En cas de retard de paiement, une pénalité égale à 3 fois le taux d''intérêt légal sera appliquée, ainsi qu''une indemnité forfaitaire pour frais de recouvrement de 40 €.'
);

alter table business_settings enable row level security;
-- Admin-only, no select policy — every read goes through supabaseAdmin,
-- matching this schema's established convention (see quotes table).
