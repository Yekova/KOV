-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  QUATRE MIGRATIONS EN ATTENTE — À COLLER DANS L'ÉDITEUR SQL SUPABASE ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- Vérifié sur la base réelle le 29 septembre 2026 : aucune des quatre n'est
-- appliquée, alors que le code qui en dépend est déployé. Six choses
-- échouent donc aujourd'hui, la plupart en silence :
--
--   1. « Convertir en facture » sur un devis          (quotes.invoice_id)
--   2. « Demander une signature » sur un devis        (quotes.yousign_*)
--   3. La page /client/quotes affichait « aucun devis » à un client qui en
--      avait — corrigé par contournement dans le code, mais la signature
--      reste invisible tant que ceci n'est pas passé
--   4. « Connecter Outlook » dans les paramètres      (profiles.ms_*)
--   5. Le formulaire de profil de /admin/settings s'affichait vide en
--      permanence — même contournement, même dépendance
--   6. Le suivi des emails ne peut rattacher un envoi ni à un client, ni à
--      un devis, ni à une facture                     (email_logs.*)
--
-- TOUTES SONT ADDITIVES : uniquement des ajouts de colonnes et deux tables
-- nouvelles. Aucune suppression, aucun renommage, aucune valeur existante
-- réécrite.
--
-- Le tout est dans UNE SEULE transaction : si une instruction échoue, rien
-- n'est appliqué et la base reste exactement dans son état actuel.
--
-- Validé avant publication dans une transaction annulée sur cette base :
-- les erreurs y remonteraient exactement comme lors d'une vraie exécution.
-- Il n'y en a pas.
--
-- La dernière instruction affiche un récapitulatif. Les quatre nombres
-- attendus sont indiqués à côté.

begin;

-- ── 1 — Le lien devis → facture ─────────────────────────────────
-- 20260831100000_add_quote_invoice_link.sql

-- Lets a quote be converted into an invoice (admin/quotes "Convertir en
-- facture" action). Nullable, set once — prevents converting the same
-- quote twice and lets the UI link straight from a quote to the invoice
-- it became.
alter table quotes add column invoice_id uuid references invoices (id) on delete set null;

comment on column quotes.invoice_id is
  'Set once this quote has been converted into an invoice — prevents converting the same quote twice and lets the UI link to the resulting invoice.';

-- ── 2 — Le compte Outlook ──────────────────────────────────────
-- 20260913090000_add_admin_microsoft_oauth.sql

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

-- ── 3 — La signature électronique ───────────────────────────────
-- 20260913090100_add_quote_electronic_signature.sql

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

-- ── 4 — Le suivi des emails ─────────────────────────────────────
-- 20260929100000_extend_email_logs_for_resend.sql

-- Ce que le suivi des emails ne peut pas faire sans ces colonnes.
--
-- email_logs existe depuis 20260901140400 et ne connaît qu'un lead. Elle
-- ne sait donc pas dire « cet email concernait ce devis », ni « celui-ci
-- est parti au client, pas au prospect ». Toute la partie CRM du suivi —
-- la frise d'une fiche client, « à relancer aujourd'hui », les relances
-- qui ne doivent pas repartir sur une facture déjà payée — en dépend.
--
-- Additif uniquement : aucune colonne existante n'est touchée, aucune
-- valeur par défaut ne réécrit les six lignes déjà présentes.

alter table email_logs
  add column if not exists client_id uuid references profiles (id) on delete set null,
  add column if not exists project_id uuid references projects (id) on delete set null,
  add column if not exists quote_id uuid references quotes (id) on delete set null,
  add column if not exists invoice_id uuid references invoices (id) on delete set null,
  -- Le type fonctionnel de l'email : WELCOME_CLIENT, PROPOSAL_REMINDER…
  -- Texte libre et non enum : une valeur nouvelle ne doit pas exiger une
  -- migration, et rien ne branche de logique dessus — c'est un filtre.
  add column if not exists email_type text,
  add column if not exists error_message text,
  add column if not exists metadata jsonb not null default '{}';

create index if not exists email_logs_client_id_idx on email_logs (client_id, created_at desc);
create index if not exists email_logs_quote_id_idx on email_logs (quote_id) where quote_id is not null;
create index if not exists email_logs_invoice_id_idx on email_logs (invoice_id) where invoice_id is not null;
create index if not exists email_logs_email_type_idx on email_logs (email_type, created_at desc);

-- provider_message_id est la clé de liaison avec les évènements du
-- fournisseur. Le webhook cherche dessus à chaque évènement reçu : sans
-- index, ça devient un balayage complet de la table.
create index if not exists email_logs_provider_message_id_idx
  on email_logs (provider_message_id) where provider_message_id is not null;

comment on column email_logs.metadata is
  'Charge utile libre de l''appelant (variables de template, identifiant d''automatisation). Jamais de secret : ni clé d''API, ni secret de webhook.';


-- Les évènements bruts, pour l'audit.
--
-- email_logs porte l'ÉTAT courant ; cette table porte l'HISTOIRE. Les deux
-- sont nécessaires et ne se remplacent pas : savoir qu'un email est
-- « ouvert » ne dit pas qu'il a rebondi deux fois avant, ni quand.
--
-- La charge utile est conservée telle quelle : le jour où un statut paraît
-- faux, c'est la seule chose qui permette de trancher entre une erreur de
-- notre lecture et une erreur du fournisseur.
create table if not exists email_events (
  id uuid primary key default gen_random_uuid(),
  email_log_id uuid references email_logs (id) on delete cascade,
  -- L'identifiant de l'évènement chez le fournisseur. Unique : c'est ce
  -- qui rend un rejeu de webhook sans effet, au niveau de la base et non
  -- au niveau du code.
  provider_event_id text unique,
  event_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists email_events_log_idx on email_events (email_log_id, created_at desc);

alter table email_events enable row level security;
-- Aucune policy, aucun grant : administration seulement, via la clé de
-- service. Même convention que project_tasks et email_logs.

-- ── Récapitulatif ────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
     where table_name = 'quotes' and column_name = 'invoice_id')            as quotes_invoice_id,      -- attendu 1
  (select count(*) from information_schema.columns
     where table_name = 'quotes'
       and column_name in ('yousign_request_id','yousign_signer_id','signing_url','signed_at','signed_pdf_storage_path')) as quotes_signature,  -- attendu 5
  (select count(*) from information_schema.columns
     where table_name = 'profiles' and column_name like 'ms\_%')            as profiles_microsoft,     -- attendu 3
  (select count(*) from information_schema.columns
     where table_name = 'email_logs'
       and column_name in ('client_id','project_id','quote_id','invoice_id','email_type','error_message','metadata')) as email_logs_crm,      -- attendu 7
  (select count(*) from information_schema.tables
     where table_name = 'email_events')                                     as table_email_events;     -- attendu 1

commit;
