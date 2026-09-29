-- La messagerie interne : réactions, pièces jointes, réponses, corbeille.
--
-- request_messages ne portait que id, thread_id, client_id, body,
-- created_by, author_admin_id, created_at. Aucune des quatre fonctions
-- demandées n'était donc représentable — c'est pourquoi elles avaient été
-- écartées jusqu'ici plutôt qu'inventées.
--
-- ── LES DÉCISIONS PRISES AVEC LE PROPRIÉTAIRE ────────────────────────
--
-- 1. SUPPRESSION PRUDENTE. Un message n'est supprimable que par son
--    auteur et laisse une trace à sa place. Une conversation supprimée
--    ne disparaît QUE de la liste de celui qui l'a supprimée : l'autre
--    côté la garde. Personne ne peut faire disparaître un engagement
--    écrit de l'écran d'en face — dans une relation commerciale, c'est
--    la propriété qui compte le plus.
--
-- 2. SIX RÉACTIONS FIXES. Contraintes en base, pas seulement dans
--    l'interface : une liste ouverte laisse entrer n'importe quelle
--    chaîne, et la rangée sous un message devient illisible.
--
-- 3. UNE PIÈCE JOINTE EST UN DOCUMENT. Elle s'inscrit dans `documents`,
--    la table que la page Documents du client lit déjà, et la table
--    ci-dessous ne fait que la relier au message. Un fichier, une seule
--    source de vérité : recopier nom, chemin et taille dans une seconde
--    table produirait deux vérités qui divergent au premier renommage.

begin;

-- ── 1. Répondre à un message, et le supprimer ────────────────────────

alter table request_messages
  add column reply_to_id uuid references request_messages (id) on delete set null,
  add column deleted_at timestamptz;

-- `on delete set null` et non cascade : supprimer définitivement un
-- message ne doit pas emporter les réponses qu'il a suscitées. La réponse
-- perd sa citation, elle ne disparaît pas.

create index request_messages_reply_to_idx
  on request_messages (reply_to_id)
  where reply_to_id is not null;

-- Les fils se lisent en excluant les supprimés : l'index porte la
-- condition, sinon il est ignoré sur la requête qui sert le plus.
create index request_messages_thread_live_idx
  on request_messages (thread_id, created_at)
  where deleted_at is null;

-- ── 2. La corbeille des conversations, côté par côté ─────────────────

-- Deux colonnes et non une : la suppression est personnelle. Le client
-- qui range sa liste ne retire rien de celle du studio, et l'inverse est
-- vrai aussi. Une colonne unique aurait forcé la suppression commune,
-- que la décision 1 écarte.
alter table request_threads
  add column deleted_by_client_at timestamptz,
  add column deleted_by_admin_at timestamptz;

-- ── 3. Les réactions ─────────────────────────────────────────────────

create table request_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references request_messages (id) on delete cascade,
  -- Dénormalisé comme partout dans ce schéma : c'est ce qui permet une
  -- policy RLS en une comparaison, sans jointure.
  client_id uuid not null references profiles (id) on delete cascade,
  emoji text not null check (emoji in ('👍', '❤️', '👏', '✅', '🔥', '🤔')),
  reactor_kind text not null check (reactor_kind in ('client', 'admin')),
  reactor_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Une personne, un emoji, une fois. Sans cette contrainte, un double
  -- clic compte deux pouces levés du même lecteur.
  unique (message_id, reactor_id, emoji)
);

create index request_message_reactions_message_idx
  on request_message_reactions (message_id);

-- ── 4. Les pièces jointes ────────────────────────────────────────────

create table request_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references request_messages (id) on delete cascade,
  -- Le fichier lui-même vit dans `documents` : nom, chemin de stockage,
  -- type, taille et visibilité y sont déjà, et la page Documents du
  -- client la lit sans rien changer.
  document_id uuid not null references documents (id) on delete cascade,
  client_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (message_id, document_id)
);

create index request_message_attachments_message_idx
  on request_message_attachments (message_id);

-- ── RLS ──────────────────────────────────────────────────────────────

-- Même forme que le reste du portail : lecture seule pour le client sur
-- ce qui le concerne. Toutes les écritures passent par des actions
-- serveur qui utilisent le rôle de service — aucune policy d'écriture
-- n'est donc ouverte ici, et c'est délibéré.

alter table request_message_reactions enable row level security;
alter table request_message_attachments enable row level security;

create policy "Clients can read reactions on their own messages"
  on request_message_reactions for select to authenticated using (client_id = auth.uid());

create policy "Clients can read attachments on their own messages"
  on request_message_attachments for select to authenticated using (client_id = auth.uid());

grant select on request_message_reactions to authenticated;
grant select on request_message_attachments to authenticated;

commit;
