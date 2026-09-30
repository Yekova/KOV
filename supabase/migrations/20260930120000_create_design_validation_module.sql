-- La validation collaborative des maquettes.
--
-- Un espace partagé où le client ouvre une maquette, clique sur la zone
-- qui le gêne, écrit son retour, et où KOV répond, corrige, publie une
-- nouvelle version, puis fait valider. L'objet est de remplacer les
-- allers-retours par email : un retour, un endroit, un statut.
--
-- ── CE QUI EXISTE DÉJÀ ET QUE L'ON NE REFAIT PAS ─────────────────────
--
-- `projects` porte le projet et son client. `project_phases` porte
-- l'avancement. `documents` porte les fichiers. Rien ici ne les double :
-- une maquette n'est pas un document (elle est versionnée, comparée et
-- validée), mais elle vit dans le même bucket privé `client-files`.
--
-- ── LES DEUX ÉCARTS ASSUMÉS PAR RAPPORT AU CAHIER DES CHARGES ────────
--
-- 1. PAS DE TABLE `design_nodes` NI `design_edges`.
--
--    Le cahier des charges demande des nœuds et des liens libres, que
--    l'admin créerait et connecterait à la main. Mais il décrit aussi,
--    en §57, un enchaînement FIXE : version → commentaires → révisions
--    → nouvelle version → validation. Si la carte est saisie à part, ces
--    deux descriptions peuvent se contredire — une page validée dont le
--    nœud dit « en cours », et personne ne sait laquelle a raison.
--
--    La carte est donc DÉRIVÉE des pages, des versions, des commentaires
--    et des validations. Seul est stocké ce qu'aucun calcul ne donne :
--    l'endroit où l'admin a posé la page sur la carte (`position_x/y`
--    ci-dessous). Un fait, une ligne.
--
--    Conséquence assumée : on ne peut pas tracer un lien arbitraire entre
--    deux nœuds. Le jour où ce serait nécessaire, `design_edges` peut
--    s'ajouter sans rien casser de ce qui est écrit ici.
--
-- 2. PAS DE TABLE `design_comment_replies`.
--
--    Une réponse est un commentaire qui en désigne un autre. Deux tables,
--    ce serait deux politiques RLS, deux chemins d'écriture et deux
--    requêtes à recoller pour afficher un fil. `request_messages` règle
--    déjà le même problème avec `reply_to_id` — on reprend la convention
--    de la maison.
--
-- ── LE VOCABULAIRE DES STATUTS ───────────────────────────────────────
--
-- Le cahier des charges liste « En validation » ET « À valider », qui
-- décrivent le même moment vu des deux côtés. Un seul statut est retenu,
-- nommé d'après CELUI QUI DOIT AGIR — c'est la seule information que le
-- statut doit transmettre :
--
--   upcoming           À venir                  personne
--   in_progress        En cours                 KOV
--   client_review      À valider                le client
--   changes_requested  Modifications demandées  KOV
--   approved           Validé                   personne
--   blocked            Bloqué                   à débloquer ensemble
--
-- `client_review` et `changes_requested` reprennent mot pour mot les
-- valeurs de `project_tasks.validation_status` : même idée, même nom.

begin;

-- ── 1. LES PAGES ─────────────────────────────────────────────────────

create table design_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  slug text not null,
  sort_order integer not null default 0,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'in_progress', 'client_review', 'changes_requested', 'approved', 'blocked')),

  -- Position sur la carte. Nulle tant que l'admin n'a rien déplacé :
  -- l'agencement automatique s'applique alors, et le client ne voit
  -- jamais une carte mal rangée (§38). Dès qu'une valeur est écrite,
  -- elle fait foi pour cette page et pour elle seule.
  position_x double precision,
  position_y double precision,

  -- Une page en préparation ne doit pas apparaître côté client. C'est la
  -- condition de la politique RLS plus bas, pas un simple filtre
  -- d'affichage : la donnée est inaccessible, pas seulement masquée.
  visible_to_client boolean not null default false,

  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (project_id, slug)
);

create index design_pages_project_idx on design_pages (project_id, sort_order);

comment on table design_pages is
  'Une page (ou un écran) soumise à validation. La carte de validation est dérivée de cette table et de ses filles — il n''existe pas de table de nœuds.';

-- ── 2. LES VERSIONS ──────────────────────────────────────────────────

create table design_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references design_pages (id) on delete cascade,

  -- Dénormalisé depuis la page. Sert la politique RLS et les index : sans
  -- lui, toute lecture d'une version passe par une jointure sur les pages.
  -- Un trigger garantit la cohérence plus bas — ce n'est pas une saisie.
  project_id uuid not null references projects (id) on delete cascade,

  -- Deux colonnes et non une. `version_label` est ce qui s'affiche
  -- (« v2.1 ») ; `version_number` est l'ordre réel. Déduire l'ordre en
  -- analysant l'étiquette serait une devinette — et « v10 » passerait
  -- avant « v9 ».
  version_label text not null,
  version_number integer not null,

  changelog text,

  -- Les trois rendus, chemins d'objet dans le bucket privé
  -- `client-files`, sous projects/{projectId}/validation/{pageId}/{n}/.
  desktop_path text,
  tablet_path text,
  mobile_path text,

  -- Une URL de préversion (staging) quand elle existe. Validée côté
  -- serveur avant affichage : jamais injectée telle quelle dans un iframe.
  preview_url text,

  status text not null default 'draft'
    check (status in ('draft', 'published', 'superseded', 'archived')),

  created_by uuid references profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),

  unique (page_id, version_number)
);

create index design_versions_page_idx on design_versions (page_id, version_number desc);
create index design_versions_project_idx on design_versions (project_id);

comment on column design_versions.status is
  'draft = visible de KOV seul. published = soumis au client. superseded = remplacé par une version plus récente, conservé pour la comparaison et pour les commentaires qui s''y rattachent. archived = retiré de la comparaison.';

-- ── 3. LES COMMENTAIRES ──────────────────────────────────────────────

create table design_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  page_id uuid not null references design_pages (id) on delete cascade,

  -- Un commentaire appartient à UNE version. Changer de version ne
  -- transporte pas les retours : « le bouton est trop bas » ne veut plus
  -- rien dire sur une maquette où il a bougé (§23).
  version_id uuid not null references design_versions (id) on delete cascade,

  -- Une réponse désigne son parent. `cascade` et non `set null` : une
  -- réponse orpheline n'a aucun sens, contrairement à un message de
  -- messagerie qui garde le sien sans sa citation.
  parent_id uuid references design_comments (id) on delete cascade,

  device text not null default 'desktop'
    check (device in ('desktop', 'tablet', 'mobile')),

  author_id uuid not null references profiles (id) on delete cascade,
  author_side text not null check (author_side in ('client', 'admin')),

  -- En pourcentage de la largeur et de la hauteur de l'image, jamais en
  -- pixels : l'épingle doit retomber au même endroit quelle que soit la
  -- taille d'affichage.
  x_percent numeric(6, 3) check (x_percent >= 0 and x_percent <= 100),
  y_percent numeric(6, 3) check (y_percent >= 0 and y_percent <= 100),

  body text not null check (length(btrim(body)) > 0),

  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'rejected')),

  -- Un retour bloquant interdit la validation de la page (§27). C'est un
  -- choix explicite de celui qui écrit, pas une déduction : tous les
  -- retours ne valent pas un refus.
  is_blocking boolean not null default false,

  -- Les personnes citées, pour la notification. Un tableau et non une
  -- table de liaison : on les lit toujours avec le commentaire, jamais
  -- séparément.
  mentioned_ids uuid[] not null default '{}',

  attachment_path text,

  resolved_at timestamptz,
  resolved_by uuid references profiles (id) on delete set null,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Une réponse ne porte pas d'épingle : elle hérite de celle du fil.
  constraint design_comments_reply_has_no_pin check (
    parent_id is null or (x_percent is null and y_percent is null)
  ),

  -- Les deux coordonnées vont ensemble. Une seule des deux ne place rien.
  constraint design_comments_pin_is_complete check (
    (x_percent is null) = (y_percent is null)
  )
);

create index design_comments_version_idx on design_comments (version_id, created_at);
create index design_comments_thread_idx on design_comments (parent_id) where parent_id is not null;
create index design_comments_page_open_idx on design_comments (page_id)
  where parent_id is null and status in ('open', 'in_progress');
create index design_comments_blocking_idx on design_comments (page_id)
  where is_blocking and status in ('open', 'in_progress');

comment on column design_comments.mentioned_ids is
  'Figé à l''écriture. Renommer quelqu''un ne réécrit pas les citations passées — comme activity_log.title, c''est un enregistrement daté.';

-- ── 4. LES VALIDATIONS ───────────────────────────────────────────────

create table design_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,

  -- Nul = validation finale de l'ensemble du projet (§28). Une page
  -- supprimée emporte ses validations de page, jamais la validation
  -- finale.
  page_id uuid references design_pages (id) on delete cascade,
  version_id uuid references design_versions (id) on delete set null,

  decision text not null check (decision in ('approved', 'changes_requested')),

  approved_by uuid not null references profiles (id) on delete cascade,
  approver_side text not null check (approver_side in ('client', 'admin')),

  -- Une validation forcée par KOV malgré des retours bloquants ouverts
  -- (§27). Elle est enregistrée comme telle : « validé » et « validé
  -- d'office » ne sont pas la même chose devant un désaccord.
  is_override boolean not null default false,

  comment text,
  created_at timestamptz not null default now()
);

create index design_approvals_project_idx on design_approvals (project_id, created_at desc);
create index design_approvals_page_idx on design_approvals (page_id, created_at desc);

comment on table design_approvals is
  'Journal, pas état courant. L''état d''une page est design_pages.status ; cette table dit qui a décidé quoi, quand, et sur quelle version. On n''y supprime rien.';

-- ── 5. LE JOURNAL ────────────────────────────────────────────────────
--
-- Pourquoi une table plutôt que `activity_log` : la cloche du client
-- compte les lignes non lues d'`activity_log`. Vingt commentaires dans
-- l'après-midi y feraient un badge « 20 » qui ne dit plus rien. Le
-- journal ci-dessous alimente le fil DANS la page ; seuls les trois
-- évènements qui méritent d'interrompre quelqu'un — nouvelle version,
-- validation demandée, page validée — écrivent aussi dans activity_log.

create table design_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  page_id uuid references design_pages (id) on delete set null,
  version_id uuid references design_versions (id) on delete set null,
  comment_id uuid references design_comments (id) on delete set null,

  actor_id uuid references profiles (id) on delete set null,
  actor_side text not null check (actor_side in ('client', 'admin', 'system')),

  event text not null check (event in (
    'page_created', 'page_published', 'version_published',
    'comment_created', 'comment_replied', 'comment_status_changed',
    'page_approved', 'changes_requested', 'final_approved'
  )),

  -- Figé à l'insertion, comme activity_log.title : le journal se lit
  -- comme un enregistrement daté, pas comme une jointure sur l'état
  -- d'aujourd'hui.
  summary text not null,

  created_at timestamptz not null default now()
);

create index design_activity_project_idx on design_activity (project_id, created_at desc);
create index design_activity_page_idx on design_activity (page_id, created_at desc);

-- ── 6. COHÉRENCE DU project_id DÉNORMALISÉ ───────────────────────────
--
-- `design_versions.project_id` et `design_comments.project_id` existent
-- pour la RLS et les index. Une valeur saisie à la main pourrait
-- désigner un autre projet que celui de la page — et la politique RLS
-- laisserait alors passer une lecture qu'elle doit refuser. Le trigger
-- l'écrit lui-même : ce n'est pas un champ de saisie.

create or replace function design_set_project_from_page()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select p.project_id into new.project_id
  from design_pages p
  where p.id = new.page_id;

  if new.project_id is null then
    raise exception 'design_pages % introuvable', new.page_id;
  end if;

  return new;
end;
$$;

create trigger design_versions_set_project
  before insert or update of page_id on design_versions
  for each row execute function design_set_project_from_page();

create trigger design_comments_set_project
  before insert or update of page_id on design_comments
  for each row execute function design_set_project_from_page();

-- ── 7. RLS ───────────────────────────────────────────────────────────
--
-- L'application lit aujourd'hui par le rôle de service, depuis des
-- actions serveur protégées par requireUser()/requireAdmin() — ces
-- politiques ne sont donc pas le chemin de lecture actuel. Elles sont
-- écrites quand même, pour deux raisons : elles disent en base ce que le
-- client a le droit de voir, et elles sont la condition pour activer un
-- jour le temps réel côté navigateur sans réécrire le modèle.
--
-- Le rôle de service les ignore : l'admin continue de tout voir.
-- Aucune politique d'écriture : toute écriture passe par une action
-- serveur qui vérifie l'identité et les droits.

alter table design_pages enable row level security;
alter table design_versions enable row level security;
alter table design_comments enable row level security;
alter table design_approvals enable row level security;
alter table design_activity enable row level security;

create policy "Clients voient les pages publiées de leurs projets"
  on design_pages for select to authenticated
  using (
    visible_to_client
    and exists (
      select 1 from projects p
      where p.id = design_pages.project_id and p.client_id = auth.uid()
    )
  );

create policy "Clients voient les versions publiées de leurs projets"
  on design_versions for select to authenticated
  using (
    status in ('published', 'superseded')
    and exists (
      select 1 from design_pages dp
      join projects p on p.id = dp.project_id
      where dp.id = design_versions.page_id
        and dp.visible_to_client
        and p.client_id = auth.uid()
    )
  );

create policy "Clients voient les commentaires de leurs projets"
  on design_comments for select to authenticated
  using (
    exists (
      select 1 from design_pages dp
      join projects p on p.id = dp.project_id
      where dp.id = design_comments.page_id
        and dp.visible_to_client
        and p.client_id = auth.uid()
    )
  );

create policy "Clients voient les validations de leurs projets"
  on design_approvals for select to authenticated
  using (
    exists (
      select 1 from projects p
      where p.id = design_approvals.project_id and p.client_id = auth.uid()
    )
  );

create policy "Clients voient le journal de leurs projets"
  on design_activity for select to authenticated
  using (
    exists (
      select 1 from projects p
      where p.id = design_activity.project_id and p.client_id = auth.uid()
    )
  );

grant select on design_pages to authenticated;
grant select on design_versions to authenticated;
grant select on design_comments to authenticated;
grant select on design_approvals to authenticated;
grant select on design_activity to authenticated;

-- ── 8. LA CLOCHE DU CLIENT ───────────────────────────────────────────
--
-- Les trois évènements qui méritent d'interrompre quelqu'un écrivent
-- aussi dans activity_log, dont la contrainte de type doit donc accepter
-- une valeur de plus. Les six valeurs existantes sont reconduites telles
-- quelles.

alter table activity_log drop constraint activity_log_type_check;
alter table activity_log add constraint activity_log_type_check
  check (type in ('document', 'message', 'invoice', 'milestone', 'quote', 'task', 'validation'));

commit;
