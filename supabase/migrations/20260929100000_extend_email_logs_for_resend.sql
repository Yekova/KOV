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
