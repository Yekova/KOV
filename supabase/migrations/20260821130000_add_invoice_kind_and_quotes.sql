alter table invoices
  add column kind text not null default 'full' check (kind in ('full', 'deposit', 'balance')),
  add column deposit_percent integer check (deposit_percent between 1 and 100),
  add column total_project_cents integer check (total_project_cents >= 0),
  add column sent_at timestamptz;

comment on column invoices.kind is
  'full = facture unique, deposit = facture d''acompte, balance = facture de solde.';
comment on column invoices.deposit_percent is
  'Pourcentage d''acompte affiché sur le PDF (kind=deposit uniquement).';
comment on column invoices.total_project_cents is
  'Montant total du projet, pour contextualiser un acompte/solde sur le PDF — distinct de amount_cents, qui reste le montant réellement dû sur CETTE facture.';
comment on column invoices.sent_at is
  'Horodatage du dernier envoi par email via le bouton "Envoyer par email".';

create table quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles (id) on delete set null,
  lead_id uuid references leads (id) on delete set null,
  project_id uuid references projects (id) on delete set null,
  reference text not null unique,
  recipient_name text not null,
  recipient_email text,
  line_items jsonb not null default '[]',
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),
  valid_until date,
  pdf_storage_path text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotes_client_id_idx on quotes (client_id);
create index quotes_created_at_idx on quotes (created_at desc);

alter table quotes enable row level security;
-- Deliberately no select policy/grant: quotes are admin-only in this phase
-- (unlike invoices, which clients already see in their portal). All reads
-- go through supabaseAdmin, matching this schema's established convention.

comment on table quotes is
  'Devis créés par l''admin — recipient_name/recipient_email sont stockés directement (un devis peut être adressé à un lead qui n''a pas encore de compte client), pas seulement dérivés de client_id.';
comment on column quotes.line_items is
  'Array JSON de {description, quantity, unit_price_cents} — pas de table séparée pour rester simple en V1.';
