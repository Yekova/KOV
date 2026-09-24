-- La bibliothèque de prompts interne.
--
-- Un outil de production, pas une base de notes : un prompt a un contenu,
-- des variables déclarées, un historique de versions, des collections, des
-- tags, un journal d'usage et un retour d'expérience. Onze tables, parce
-- que chacune de ces choses a une durée de vie propre — un prompt archivé
-- garde ses versions, une version reste pointée par le journal d'usage
-- longtemps après avoir été remplacée.
--
-- Tout vit sous le préfixe `prompt_` : aucun de ces noms n'existe déjà, et
-- le préfixe évite la collision qui a coûté un renommage à `projects` /
-- `showcase_projects`.

-- ── Sécurité ────────────────────────────────────────────────────────────
--
-- RLS est activé partout et AUCUNE policy n'est créée, délibérément.
--
-- Ce n'est pas un oubli : c'est l'expression exacte de « personne sauf le
-- rôle service ». La bibliothèque est un outil interne, elle n'a aucun
-- lecteur public — contrairement à `posts` ou `showcase_projects`, qui ont
-- une policy de lecture parce que le site public les affiche. Ici, toutes
-- les lectures comme toutes les écritures passent par supabaseAdmin,
-- derrière requireAdmin(), exactement comme le fait déjà le CRM.
--
-- Conséquence voulue : une clé anonyme fuitée ne donne accès à rien de
-- tout cela, pas même en lecture.


-- ── Catégories ──────────────────────────────────────────────────────────
-- Une table et non une constante du front : le §7 demande qu'elles soient
-- administrables, et une catégorie codée en dur dans un composant est une
-- catégorie qu'il faut redéployer pour renommer.

create table prompt_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table prompt_categories is
  'Catégories de la bibliothèque de prompts. Administrables depuis /admin/prompts/collections.';


-- ── Prompts ─────────────────────────────────────────────────────────────

create table prompts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  title text not null,
  slug text not null unique,
  description text,
  -- Le gabarit lui-même, variables comprises, sous la forme {{cle}}.
  content text not null default '',

  -- on delete set null et non cascade : supprimer une catégorie ne doit
  -- pas emporter les prompts qu'elle classait.
  category_id uuid references prompt_categories(id) on delete set null,

  type text not null default 'build'
    check (type in ('build', 'audit', 'transform')),
  target_tool text not null default 'claude_code'
    check (target_tool in ('claude_code', 'chatgpt', 'gemini', 'flow', 'image_generation', 'generic')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'deprecated', 'archived')),

  -- Master / variante. Un seul niveau d'héritage, qui suffit à exprimer
  -- « Homepage » → Premium, Corporate, Immersive sans construire un arbre.
  parent_prompt_id uuid references prompts(id) on delete set null,

  -- La version courante. L'historique complet est dans prompt_versions ;
  -- ce compteur évite d'aller le chercher pour afficher « v3 » dans une
  -- liste de quarante lignes.
  version_number integer not null default 1,

  -- Dénormalisés pour la même raison : la fiche affiche un nombre
  -- d'utilisations, et un count() sur le journal à chaque ligne de liste
  -- serait une jointure par ligne pour une information d'en-tête.
  usage_count integer not null default 0,
  last_used_at timestamptz,

  created_by uuid references profiles(id) on delete set null
);

comment on table prompts is
  'Bibliothèque de prompts interne KOV. Lecture et écriture par le rôle service uniquement, derrière requireAdmin().';

create index prompts_category_idx on prompts (category_id);
create index prompts_status_idx on prompts (status);
create index prompts_target_tool_idx on prompts (target_tool);
create index prompts_updated_idx on prompts (updated_at desc);
create index prompts_last_used_idx on prompts (last_used_at desc nulls last);
create index prompts_parent_idx on prompts (parent_prompt_id);

-- La recherche plein texte sur `content` reste un parcours séquentiel : à
-- l'échelle d'une bibliothèque interne (des dizaines, pas des millions de
-- lignes) c'est le bon compromis, et un index trigramme coûterait une
-- extension pour un gain nul aujourd'hui. Le jour où ça se voit :
--   create extension pg_trgm;
--   create index prompts_content_trgm_idx on prompts using gin (content gin_trgm_ops);


-- ── Variables ───────────────────────────────────────────────────────────
-- Déclarées à part du contenu, ce qui permet de leur donner un type, un
-- libellé et des options — et ce qui crée un risque de dérive avec les
-- {{cle}} réellement présentes dans le texte. L'éditeur réconcilie les
-- deux en continu ; la base ne fait que stocker la déclaration.

create table prompt_variables (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,

  key text not null,
  label text,
  type text not null default 'text'
    check (type in ('text', 'textarea', 'select', 'multiselect', 'boolean', 'number', 'url', 'code')),
  default_value text,
  placeholder text,
  description text,
  -- Les choix d'un select / multiselect : ["Premium", "Corporate"].
  options_json jsonb not null default '[]',
  required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  -- Deux variables du même nom dans un même prompt n'auraient aucun sens :
  -- la substitution remplace toutes les occurrences de {{cle}} d'un coup.
  unique (prompt_id, key)
);

create index prompt_variables_prompt_idx on prompt_variables (prompt_id, sort_order);


-- ── Versions ────────────────────────────────────────────────────────────
-- Immuable, et c'est tout l'intérêt. Restaurer une v3 n'écrase pas la v7 :
-- ça écrit le contenu de la v3 dans une v8. L'historique ne se réécrit
-- jamais, sinon « quelle version a été utilisée » n'a plus de réponse.

create table prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  version_number integer not null,
  content text not null,
  change_note text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (prompt_id, version_number)
);

create index prompt_versions_prompt_idx on prompt_versions (prompt_id, version_number desc);


-- ── Tags ────────────────────────────────────────────────────────────────

create table prompt_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table prompt_tag_links (
  prompt_id uuid not null references prompts(id) on delete cascade,
  tag_id uuid not null references prompt_tags(id) on delete cascade,
  primary key (prompt_id, tag_id)
);

create index prompt_tag_links_tag_idx on prompt_tag_links (tag_id);


-- ── Collections ─────────────────────────────────────────────────────────
-- Transversales aux catégories : un prompt a une catégorie (son métier) et
-- appartient à autant de collections qu'on veut (un client, un chantier).

create table prompt_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table prompt_collection_items (
  collection_id uuid not null references prompt_collections(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, prompt_id)
);

create index prompt_collection_items_prompt_idx on prompt_collection_items (prompt_id);


-- ── Favoris ─────────────────────────────────────────────────────────────
-- Par utilisateur, et non un booléen sur le prompt : l'étoile de l'un ne
-- doit pas s'allumer chez l'autre.

create table prompt_user_favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

create index prompt_user_favorites_prompt_idx on prompt_user_favorites (prompt_id);


-- ── Journal d'usage ─────────────────────────────────────────────────────
-- Ce qui permet de répondre à « quelle version ai-je utilisée sur ce
-- projet ». On enregistre les variables saisies, parce que sans elles la
-- ligne ne dit pas ce qui a réellement été généré ; on n'enregistre pas la
-- sortie, qui est reconstructible à partir des deux.
--
-- cascade sur prompt_id : la suppression d'un prompt est déjà le chemin
-- destructeur confirmé, et un journal pointant vers le vide ne vaut pas
-- mieux qu'un journal effacé.

create table prompt_usage (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  version_id uuid references prompt_versions(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  variables_json jsonb not null default '{}',
  target_tool text,
  created_at timestamptz not null default now()
);

create index prompt_usage_prompt_idx on prompt_usage (prompt_id, created_at desc);
create index prompt_usage_created_idx on prompt_usage (created_at desc);


-- ── Retour d'expérience ─────────────────────────────────────────────────
-- Au moins l'un des trois champs doit être rempli : un avis vide n'est pas
-- un avis, et le check évite que le bouton « envoyer » crée du bruit.

create table prompt_feedback (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  verdict text check (verdict in ('up', 'down')),
  rating smallint check (rating between 1 and 5),
  feedback text,
  created_at timestamptz not null default now(),

  constraint prompt_feedback_not_empty
    check (verdict is not null or rating is not null or feedback is not null)
);

create index prompt_feedback_prompt_idx on prompt_feedback (prompt_id, created_at desc);


-- ── Blocs ───────────────────────────────────────────────────────────────
-- La matière du Prompt Builder : des fragments réutilisables qu'on empile
-- pour composer un prompt neuf. Volontairement plat — pas de variables, pas
-- de versions. Un bloc qui mérite les deux est un prompt.

create table prompt_blocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  slug text not null unique,
  description text,
  content text not null default '',
  category text,
  status text not null default 'active'
    check (status in ('draft', 'active', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references profiles(id) on delete set null
);

create index prompt_blocks_status_idx on prompt_blocks (status, sort_order);


-- ── updated_at ──────────────────────────────────────────────────────────
-- search_path épinglé, comme les autres fonctions de ce dossier : une
-- fonction au search_path mutable résout ses noms contre celui de
-- l'appelant.

create or replace function set_prompt_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- La clause WHEN n'est pas une optimisation : sans elle, utiliser un prompt
-- le ferait passer en tête de « Récemment modifiés ». Incrémenter le
-- compteur d'usage est une écriture sur la ligne, donc le trigger se
-- déclencherait et updated_at mentirait — il dirait « modifié » là où il
-- s'est seulement passé « consulté ». La condition dit : bouge updated_at à
-- chaque mise à jour SAUF celle qui ne touche que les compteurs d'usage.
create trigger prompts_set_updated_at
  before update on prompts
  for each row
  when (
    old.usage_count is not distinct from new.usage_count
    and old.last_used_at is not distinct from new.last_used_at
  )
  execute function set_prompt_updated_at();

create trigger prompt_blocks_set_updated_at
  before update on prompt_blocks
  for each row execute function set_prompt_updated_at();


-- ── RLS ─────────────────────────────────────────────────────────────────
-- Activé sans policy : voir l'en-tête de ce fichier.

alter table prompt_categories enable row level security;
alter table prompts enable row level security;
alter table prompt_variables enable row level security;
alter table prompt_versions enable row level security;
alter table prompt_tags enable row level security;
alter table prompt_tag_links enable row level security;
alter table prompt_collections enable row level security;
alter table prompt_collection_items enable row level security;
alter table prompt_user_favorites enable row level security;
alter table prompt_usage enable row level security;
alter table prompt_feedback enable row level security;
alter table prompt_blocks enable row level security;


-- ── Catégories de départ ────────────────────────────────────────────────
-- De la configuration, pas du contenu : la bibliothèque a besoin d'un
-- classement pour exister, et celui-ci est celui du §7. Renommables et
-- supprimables depuis l'admin.

insert into prompt_categories (name, slug, sort_order) values
  ('Strategy',         'strategy',          10),
  ('UX',               'ux',                20),
  ('UI / Design',      'ui-design',         30),
  ('Development',      'development',       40),
  ('Motion',           'motion',            50),
  ('WebGL / 3D',       'webgl-3d',          60),
  ('Content',          'content',           70),
  ('SEO',              'seo',               80),
  ('Performance',      'performance',       90),
  ('Supabase',         'supabase',         100),
  ('Admin / CRM',      'admin-crm',        110),
  ('Automation',       'automation',       120),
  ('Image Generation', 'image-generation', 130),
  ('Video Generation', 'video-generation', 140),
  ('Audit',            'audit',            150),
  ('Debug',            'debug',            160)
on conflict (slug) do nothing;
