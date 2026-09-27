-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  TROIS MIGRATIONS MANQUANTES — À COLLER DANS L'ÉDITEUR SQL SUPABASE  ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- Constaté le 27 septembre 2026 en comparant supabase/migrations/ à la base
-- réelle : ces trois migrations n'ont jamais été appliquées, alors que le
-- code qui en dépend est déployé. Trois fonctionnalités échouent donc
-- silencieusement en production :
--
--   1. « Convertir en facture » sur un devis  (quotes.invoice_id)
--   2. « Connecter Outlook » dans les paramètres  (profiles.ms_*)
--   3. « Demander une signature » sur un devis  (quotes.yousign_*)
--
-- Elles sont toutes ADDITIVES : uniquement des ajouts de colonnes, aucune
-- suppression, aucun renommage. Rien de ce qui existe ne bouge.
--
-- Le tout est dans une transaction : si une instruction échoue, rien n'est
-- appliqué. La dernière instruction affiche un récapitulatif, qui doit
-- rendre 1, 3 et 5.
--
-- Ce fichier ne contient PAS les trois migrations de la galerie de marques,
-- qui attendent de leur côté dans appliquer-les-migrations-en-attente.sql.
-- Elles ne cassent rien tant qu'elles ne sont pas appliquées ; celles-ci,
-- si.

begin;

-- ─────────────────────────────────────────────────────────────────────
-- quotes.invoice_id — sans quoi « Convertir en facture » échoue
-- source : supabase/migrations/20260831100000_add_quote_invoice_link.sql
-- ─────────────────────────────────────────────────────────────────────

-- Lets a quote be converted into an invoice (admin/quotes "Convertir en
-- facture" action). Nullable, set once — prevents converting the same
-- quote twice and lets the UI link straight from a quote to the invoice
-- it became.
alter table quotes add column invoice_id uuid references invoices (id) on delete set null;

comment on column quotes.invoice_id is
  'Set once this quote has been converted into an invoice — prevents converting the same quote twice and lets the UI link to the resulting invoice.';



-- ─────────────────────────────────────────────────────────────────────
-- profiles.ms_* — sans quoi « Connecter Outlook » échoue
-- source : supabase/migrations/20260913090000_add_admin_microsoft_oauth.sql
-- ─────────────────────────────────────────────────────────────────────

alter table profiles
  add column ms_refresh_token text,
  add column ms_connected_email text,
  add column ms_connected_at timestamptz;

comment on column profiles.ms_refresh_token is
  'OAuth2 refresh token for Microsoft Graph delegated send (Mail.Send) — lets this admin''s outbound CRM emails (lead replies, invoices, quotes) go out from their real Outlook/Microsoft 365 mailbox instead of the shared Brevo sender. Only ever set on role=admin rows; read/written exclusively via supabaseAdmin, same as every other admin-only column in this schema.';
comment on column profiles.ms_connected_email is
  'The Outlook/Microsoft 365 address this admin connected, shown back to them in Paramètres so they can see which mailbox is wired up.';
comment on column profiles.ms_connected_at is
  'When this admin last completed the Microsoft OAuth connection — shown in Paramètres, cleared on disconnect.';



-- ─────────────────────────────────────────────────────────────────────
-- quotes.yousign_* — sans quoi la signature électronique échoue
-- source : supabase/migrations/20260913090100_add_quote_electronic_signature.sql
-- ─────────────────────────────────────────────────────────────────────

alter table quotes
  add column yousign_request_id text,
  add column yousign_signer_id text,
  add column signing_url text,
  add column signed_at timestamptz,
  add column signed_pdf_storage_path text;

comment on column quotes.yousign_request_id is
  'Yousign signature_request id once an admin has requested an electronic signature for this quote — null means no signature has ever been requested.';
comment on column quotes.yousign_signer_id is
  'Yousign signer id for the client on this signature request — needed to verify/match incoming webhook events.';
comment on column quotes.signing_url is
  'The client''s real Yousign signing link, shown as "Signer le devis" in their portal. Not a preview/mock link — visiting it opens the actual eIDAS-compliant signing flow.';
comment on column quotes.signed_at is
  'Set only by the Yousign webhook once the client has actually completed signing — never set optimistically from the admin side.';
comment on column quotes.signed_pdf_storage_path is
  'The final signed PDF (carrying Yousign''s audit trail/certificate) downloaded from Yousign after completion and stored in our own bucket, same convention as quotes.pdf_storage_path/invoices.pdf_storage_path.';


commit;


-- ── Récapitulatif ────────────────────────────────────────────────────────
-- Attendu : 1, 3, 5

select
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='quotes' and column_name='invoice_id')      as quote_invoice_id,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='profiles'
       and column_name in ('ms_refresh_token','ms_connected_email','ms_connected_at'))      as profils_microsoft,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='quotes'
       and column_name in ('yousign_request_id','yousign_signer_id','signing_url',
                           'signed_at','signed_pdf_storage_path'))                          as quote_signature;
