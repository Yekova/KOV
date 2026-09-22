-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE — UNE SEULE FOIS            ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- Ce fichier n'est PAS une migration. Il vit volontairement en dehors de
-- supabase/migrations/ pour que « supabase db push » ne le rejoue pas : il
-- ne contient que la concaténation, dans le bon ordre, des migrations en
-- attente sur ce projet.
--
--   • Si vous utilisez la CLI Supabase : ignorez ce fichier et lancez
--     « supabase db push ». Les migrations partiront d'elles-mêmes.
--   • Si vous passez par l'éditeur SQL du dashboard : collez tout ceci,
--     exécutez une fois, et c'est terminé.
--
-- L'ordre compte à un seul endroit : le bloc 2 référence des tables créées
-- par le bloc 1. Les blocs 3 et 4 sont indépendants de tout le reste.
--
-- À exécuter sur une base où ces tables n'existent pas encore. Si une
-- erreur « already exists » apparaît, c'est que le bloc concerné est déjà
-- passé : retirez-le et relancez le reste.
--
-- 20260921120000_create_brand_gallery.sql n'est pas repris ici : le bloc 1
-- crée directement la forme finale et reprend l'ancienne table si elle
-- existe. L'inclure reviendrait à créer une table pour la supprimer aussitôt.



-- ─────────────────────────────────────────────────────────────────────
-- BLOC 1/4 — Brands Gallery — marques, emplacements, créations (remplace brand_gallery)
-- source : supabase/migrations/20260922120000_split_brand_gallery.sql
-- ─────────────────────────────────────────────────────────────────────

-- The Brands Gallery, as something that can be sold.
--
-- brand_gallery held three different objects in one row: who a brand is,
-- where and when it stands, and what it shows there. That is fine for one
-- stand per brand forever, and it breaks on the first sale — a brand
-- renews, moves address, takes two, comes back next year, and none of that
-- is expressible in a row with no notion of a period. It is also not
-- invoiceable: there is nothing to put on a quote.
--
-- So: identity, occupancy and creative become three tables, and the
-- addresses themselves become a fourth. The move is made now rather than
-- later because it is cheap while the table is empty and expensive once it
-- is not.

-- ── The addresses ──────────────────────────────────────────────────────
--
-- Seeded from GALLERY_SLOTS in the room's own layout. Coordinates are
-- deliberately NOT here: the building is geometry in the code, and a row
-- that carried an x and a z could put a stand inside a wall. A placement
-- names an address; where that address is, is not a row's business.
create table gallery_slots (
  id text primary key,
  level smallint not null check (level in (0, 1)),
  -- Human wording for the admin and for a quote line.
  label text not null,
  sort integer not null
);

insert into gallery_slots (id, level, label, sort) values
  ('n0-north-c', 0, 'Niveau 0 — niche centrale, mur nord (face au portail)', 1),
  ('n0-north-w', 0, 'Niveau 0 — niche ouest, mur nord', 2),
  ('n0-north-e', 0, 'Niveau 0 — niche est, mur nord', 3),
  ('n0-west-n',  0, 'Niveau 0 — niche nord, mur ouest', 4),
  ('n0-west-s',  0, 'Niveau 0 — niche sud, mur ouest', 5),
  ('n0-east-n',  0, 'Niveau 0 — niche nord, mur est', 6),
  ('n0-east-s',  0, 'Niveau 0 — niche sud, mur est', 7),
  ('n1-north-c', 1, 'Niveau 1 — niche centrale, mur nord', 8),
  ('n1-north-w', 1, 'Niveau 1 — niche ouest, mur nord', 9),
  ('n1-north-e', 1, 'Niveau 1 — niche est, mur nord', 10),
  ('n1-west-n',  1, 'Niveau 1 — niche nord, mur ouest', 11),
  ('n1-west-c',  1, 'Niveau 1 — niche centrale, mur ouest', 12),
  ('n1-west-s',  1, 'Niveau 1 — niche sud, mur ouest', 13),
  ('n1-east-n',  1, 'Niveau 1 — niche nord, mur est', 14),
  ('n1-east-c',  1, 'Niveau 1 — niche centrale, mur est', 15),
  ('n1-east-s',  1, 'Niveau 1 — niche sud, mur est', 16),
  ('n1-south-w', 1, 'Niveau 1 — niche ouest, mur sud', 17),
  ('n1-south-e', 1, 'Niveau 1 — niche est, mur sud', 18);

-- ── Who the brand is ───────────────────────────────────────────────────
create table brands (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  slug text not null unique,
  description text,
  website_url text,
  logo_url text,

  -- The sponsor's own account in the client portal, where they will read
  -- their report and replace their creative. Null until they have one:
  -- a brand can be on a quote before anyone has been invited.
  profile_id uuid references profiles (id) on delete set null
);

-- ── Where and when it stands ───────────────────────────────────────────
create table brand_placements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  brand_id uuid not null references brands (id) on delete cascade,
  slot_id text not null references gallery_slots (id) on delete restrict,

  -- What the stand is allowed to show. A capability, not a price: the
  -- price lives on the quote, where a price belongs, and is a number a
  -- human wrote rather than a column anyone can read off the public API.
  tier text not null default 'presence'
    check (tier in ('presence', 'showcase', 'immersive', 'exclusive')),

  starts_on date not null,
  ends_on date not null,
  constraint placement_period check (ends_on > starts_on),

  status text not null default 'draft'
    check (status in ('draft', 'confirmed', 'cancelled')),

  -- The commercial trail. Nullable because a placement can be drafted
  -- before either document exists.
  quote_id uuid references quotes (id) on delete set null,
  invoice_id uuid references invoices (id) on delete set null,
  paid_at timestamptz,
  -- The explicit escape hatch, named for what it is rather than hidden in
  -- a status value: a placement that goes live without a payment because
  -- someone decided so, and left a note saying who and why.
  billing_waived boolean not null default false,
  billing_waived_note text,

  is_featured boolean not null default false
);

-- The most valuable line in this file.
--
-- An address is a finite thing and the same one cannot be sold twice over
-- overlapping dates. Enforced here rather than in application code,
-- because the admin UI, the cron and anything added later all write to
-- this table, and only the database sees all three. Cancelled placements
-- are excluded so a cancellation actually frees the address.
create extension if not exists btree_gist;

alter table brand_placements
  add constraint brand_placements_no_double_booking
  exclude using gist (
    slot_id with =,
    daterange(starts_on, ends_on, '[)') with &&
  )
  where (status <> 'cancelled');

create index brand_placements_brand_idx on brand_placements (brand_id);
create index brand_placements_live_idx on brand_placements (status, starts_on, ends_on);

-- ── What it shows ──────────────────────────────────────────────────────
--
-- Versioned rather than overwritten: a sponsor changes their film halfway
-- through a term, and the row that was live in March is what a March
-- report is about.
create table brand_creatives (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  placement_id uuid not null references brand_placements (id) on delete cascade,

  cover_url text,
  video_url text,
  model_url text,

  is_current boolean not null default true
);

-- One current creative per placement, and Postgres is what guarantees it.
create unique index brand_creatives_one_current
  on brand_creatives (placement_id)
  where is_current;

-- ── What the room reads ────────────────────────────────────────────────
--
-- One projection, and the only thing the anonymous key can see. The base
-- tables keep row-level security with no public policy at all, so a draft
-- placement, a cancelled one, an unpaid one, a sponsor's profile link and
-- every commercial id are unreachable from a browser — not filtered out by
-- a client that could forget, but absent from what is exposed.
--
-- The view is owner-invoked on purpose (the Supabase linter will flag it,
-- and this comment is the answer): it is a deliberate, narrow window onto
-- tables that are otherwise closed.
create view public_gallery as
select
  p.id as placement_id,
  p.slot_id,
  p.tier,
  p.is_featured,
  b.id as brand_id,
  b.name,
  b.slug,
  b.description,
  b.website_url,
  b.logo_url,
  c.cover_url,
  c.video_url,
  c.model_url
from brand_placements p
join brands b on b.id = p.brand_id
left join brand_creatives c on c.placement_id = p.id and c.is_current
where p.status = 'confirmed'
  and (p.paid_at is not null or p.billing_waived)
  and current_date >= p.starts_on
  and current_date < p.ends_on;

alter table gallery_slots enable row level security;
alter table brands enable row level security;
alter table brand_placements enable row level security;
alter table brand_creatives enable row level security;

-- No policies: nothing but the service role reaches these directly.
revoke all on gallery_slots, brands, brand_placements, brand_creatives from anon, authenticated;

grant select on public_gallery to anon, authenticated;
grant select on gallery_slots to authenticated;

-- ── Housekeeping ───────────────────────────────────────────────────────
create or replace function set_brand_updated_at()
returns trigger
language plpgsql
-- Pinned, per the convention the rest of these migrations follow: a
-- function with a mutable search_path resolves its names against whatever
-- the caller happens to have set.
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger brands_updated_at
  before update on brands
  for each row execute function set_brand_updated_at();

create trigger brand_placements_updated_at
  before update on brand_placements
  for each row execute function set_brand_updated_at();

-- ── The old table ──────────────────────────────────────────────────────
--
-- Carried over rather than dropped blind, in case this project's database
-- already had rows in it. A row there had coordinates instead of an
-- address, so the slot is matched by rounding its position against the
-- authored ones; anything that matches nothing is left behind rather than
-- guessed at, and the old table is only dropped once.
do $$
declare
  legacy record;
  new_brand uuid;
begin
  if to_regclass('public.brand_gallery') is null then
    return;
  end if;

  for legacy in execute 'select * from brand_gallery' loop
    -- Reset every iteration. Without it, an "on conflict do nothing" that
    -- returns no row leaves the previous brand's id in the variable, and
    -- the next placement is attached to the wrong brand.
    new_brand := null;

    insert into brands (name, slug, description, website_url, logo_url)
    values (legacy.name, legacy.slug, legacy.description, legacy.website_url, legacy.logo_url)
    on conflict (slug) do nothing
    returning id into new_brand;

    if new_brand is null then
      continue;
    end if;

    -- A year from today, confirmed and waived: the intent is to keep a
    -- stand that was live visible, not to invent a contract for it.
    insert into brand_placements (brand_id, slot_id, tier, starts_on, ends_on, status, billing_waived, billing_waived_note, is_featured)
    select new_brand, s.id, legacy.tier, current_date, current_date + 365, 'confirmed', true,
           'Repris de brand_gallery lors de la migration du 22/09/2026', legacy.is_featured
    from gallery_slots s
    where s.id = 'n0-north-c'
    limit 1;

    insert into brand_creatives (placement_id, cover_url, video_url, model_url)
    select id, legacy.cover_url, legacy.video_url, legacy.model_url
    from brand_placements where brand_id = new_brand;
  end loop;

  drop table brand_gallery;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────
-- BLOC 2/4 — Brands Gallery — mesure (dépend du bloc 1)
-- source : supabase/migrations/20260922120100_create_brand_events.sql
-- ─────────────────────────────────────────────────────────────────────

-- What a placement is worth, measured.
--
-- You cannot sell a placement you cannot report on, and the one rule this
-- project has about numbers is that they are never invented. A sponsor
-- report is where that rule bites hardest: it is the one surface whose
-- figures someone pays against, so they have to be defensible — server
-- timestamped, tied to a placement that was actually live, and impossible
-- to write from a browser.
--
-- Hence: nothing here is reachable with the anonymous key. Events arrive
-- through /api/studio/gallery-events, which resolves them against the live
-- gallery and drops anything that does not match, and writes with the
-- service role.

create table brand_events (
  id bigint generated always as identity primary key,
  -- Server time, always. A client clock is a thing an attacker sets.
  occurred_at timestamptz not null default now(),

  placement_id uuid not null references brand_placements (id) on delete cascade,
  slot_id text not null references gallery_slots (id) on delete restrict,

  event text not null check (
    event in ('brand_stand_view', 'brand_stand_interact', 'brand_video_play', 'brand_cta_click')
  ),

  -- An opaque, per-page-load token. It is generated in memory and never
  -- written to the visitor's device, which is the whole point: nothing is
  -- stored on the terminal, so this is not a cookie and does not turn into
  -- a consent question. The cost is honest and worth stating in any
  -- report — a reload counts as a new session, so "sessions" here means
  -- visits to the room, not people.
  session text not null check (length(session) between 8 and 64)
);

create index brand_events_rollup_idx on brand_events (occurred_at, placement_id);

-- The daily roll-up the report actually reads.
--
-- Not an optimisation ahead of need: a report that scans the raw table gets
-- slow on exactly the day it starts to matter, and a sponsor refreshing
-- their page should not be running a sequential scan over a year of events.
create table brand_metrics_daily (
  day date not null,
  -- restrict, not cascade: a placement someone was invoiced against is
  -- cancelled, never deleted, and the database is where that is settled.
  -- Deleting it would take the report it was billed on with it.
  placement_id uuid not null references brand_placements (id) on delete restrict,
  event text not null,
  events integer not null,
  sessions integer not null,
  primary key (day, placement_id, event)
);

alter table brand_events enable row level security;
alter table brand_metrics_daily enable row level security;
revoke all on brand_events, brand_metrics_daily from anon, authenticated;

-- ── The roll-up ────────────────────────────────────────────────────────
create or replace function roll_up_brand_metrics(target date default (current_date - 1))
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  written integer;
begin
  insert into brand_metrics_daily (day, placement_id, event, events, sessions)
  select
    target,
    placement_id,
    event,
    count(*)::integer,
    count(distinct session)::integer
  from brand_events
  where occurred_at >= target::timestamptz
    and occurred_at < (target + 1)::timestamptz
  group by placement_id, event
  -- Idempotent: running it twice for the same day rewrites that day rather
  -- than doubling it, which is what makes it safe to re-run after a missed
  -- cron.
  on conflict (day, placement_id, event) do update
    set events = excluded.events,
        sessions = excluded.sessions;

  get diagnostics written = row_count;
  return written;
end;
$$;

-- ── Retention ──────────────────────────────────────────────────────────
--
-- Raw events are kept only as long as they are needed to build and audit
-- the roll-up. Keeping them forever would be collecting behavioural data
-- with no purpose left to justify it, which is the definition of what data
-- minimisation is against. Called by the daily cron with 90 days.
create or replace function prune_brand_events(keep_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from brand_events where occurred_at < now() - (keep_days || ' days')::interval;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- A new function is executable by PUBLIC by default, which would put both
-- of these behind the anonymous key. Revoked, then granted back to exactly
-- the role the cron runs as — without the grant, the revoke would lock out
-- the service role too.
revoke all on function roll_up_brand_metrics(date) from public, anon, authenticated;
revoke all on function prune_brand_events(integer) from public, anon, authenticated;
grant execute on function roll_up_brand_metrics(date) to service_role;
grant execute on function prune_brand_events(integer) to service_role;


-- ─────────────────────────────────────────────────────────────────────
-- BLOC 3/4 — Portfolio — table des réalisations + vos six projets actuels
-- source : supabase/migrations/20260922130000_create_showcase_projects.sql
-- ─────────────────────────────────────────────────────────────────────

-- The public portfolio, as rows.
--
-- It lived in src/data/projects.ts: six entries, twenty-one fields, frozen
-- at build time. Correcting a word meant a deployment. This is the same
-- shape, in a table, so /admin can edit it.
--
-- Named `showcase_projects` and not `projects` because `projects` is
-- already taken — by the client portal's delivery tracker (client_id,
-- progress_percent, deadlines, tasks), which has nothing to do with the
-- public showcase. Same reason /admin/realisations is not /admin/projects.

create table showcase_projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The anchor on /projets and the preview URL. Takes over from `id`, which
  -- currently does three jobs at once.
  slug text not null unique,
  -- The ordinal a visitor reads on the face of the card ("01"). Also `id`'s
  -- job today, which a uuid cannot do.
  reference text not null,
  name text not null,

  -- Two axes, not one.
  --
  -- `publication` says whether the row is online; `kind` says what it is
  -- once it is. Folding them into a single column would make the most
  -- ordinary case inexpressible: drafting an entry that is itself "à venir".
  -- It is also what leaves the TypeScript `ProjectStatus` type untouched —
  -- `kind` is exactly that union.
  publication text not null default 'draft'
    check (publication in ('draft', 'published')),
  kind text not null default 'upcoming'
    check (kind in ('live', 'upcoming', 'invitation')),
  published_at timestamptz,
  -- Null until the first reorder, same "assign index-based values on first
  -- use" pattern as posts.sort_order and project_tasks.position.
  sort_order integer,

  category text not null,
  tags text[] not null default '{}',

  summary text,
  tagline text,
  -- TipTap HTML, like posts.body.
  detail text,
  brief text,

  -- Three nullable columns for what the TypeScript type models as one
  -- all-or-nothing object. The honesty rule stays in the mapper, which only
  -- builds `narrative` when all three are filled: a check constraint here
  -- would refuse to save a half-written draft, which is the one thing a
  -- draft is for.
  narrative_problem text,
  narrative_system text,
  narrative_result text,

  deliverables text[] not null default '{}',
  location text,
  href text,
  case_study_href text,

  -- Object paths, not URLs — same call as posts.cover_image_path. A URL
  -- goes stale when a bucket moves; a path is resolved at read time. The
  -- resolver also passes through the "/work/..." public paths the seed
  -- below carries, so existing files keep working untouched.
  image_path text,
  screen_path text,
  hover_logo_path text,
  gallery_paths text[] not null default '{}',

  video_path text,
  video_poster_path text,
  -- Real pixel dimensions. SheetVideo uses them only to reserve the box via
  -- aspect-ratio, so a wrong value is a wrongly-shaped frame — which is why
  -- the admin form derives them from the file rather than asking.
  video_width integer,
  video_height integer,
  video_duration text,

  -- [{value, label}]. Measured and attributable, or absent.
  metrics jsonb not null default '[]',
  testimonial_quote text,
  testimonial_author text,

  -- Per-surface visibility. The homepage grid is three columns by two and
  -- wants six; /projets shows everything.
  show_on_home boolean not null default true,
  featured boolean not null default false
);

comment on table showcase_projects is
  'Public portfolio for /projets and the homepage grid, edited from /admin/realisations. Not the client portal projects table.';

create index showcase_projects_order_idx
  on showcase_projects (publication, sort_order nulls last, created_at desc);

alter table showcase_projects enable row level security;

-- Published rows are public; everything else never leaves the database, so
-- the preview route reads it server-side behind requireAdmin(). All writes
-- go through supabaseAdmin from /admin/realisations, so there is no insert,
-- update or delete policy — same model as `posts`.
create policy "Public can read published showcase projects" on showcase_projects
  for select using (publication = 'published');

create or replace function set_showcase_updated_at()
returns trigger
language plpgsql
-- Pinned, per the convention the rest of these migrations follow: a
-- function with a mutable search_path resolves its names against whatever
-- the caller happens to have set.
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger showcase_projects_updated_at
  before update on showcase_projects
  for each row execute function set_showcase_updated_at();

-- ── The six entries that were in the file ──────────────────────────────
--
-- Carried over verbatim so nothing disappears on the day the code switches
-- over. Image paths stay as the "/work/..." and "/studio/..." public paths
-- they are today; the resolver treats a leading slash as a local file and
-- anything else as a storage key, so uploads and existing assets coexist.

insert into showcase_projects
  (slug, reference, name, publication, kind, published_at, sort_order, category, tags,
   href, image_path, screen_path, tagline, hover_logo_path, gallery_paths,
   narrative_problem, narrative_system, narrative_result, summary, show_on_home)
values
  ('kanti', '01', 'Kanti', 'published', 'live', now(), 0,
   'Gestion de patrimoine', array['Stratégie', 'Design', 'Développement'],
   'https://www.kanti-patrimoine.com/', '/work/kanti-mockup.webp', '/work/kanti-screen.webp',
   'Clarté et confiance', '/work/kanti-logo.png', array['/work/kanti-mockup.webp'],
   'Une offre patrimoniale complexe à structurer.',
   'Architecture, design system, responsive, contenu.',
   'Une expérience plus claire, cohérente et évolutive.',
   null, true),

  ('kov-virtual-studio', '02', 'KOV Virtual Studio', 'published', 'live', now(), 1,
   'Plateforme immersive', array['Immersif', '360°', 'Technologie'],
   '/studio', '/studio/covers/studio-cover.webp', null,
   'Six salles à parcourir', '/kov/brand/kov-monogram-k-transparent.png',
   array['/studio/covers/studio-detail-01.webp', '/studio/covers/studio-detail-02.webp', '/studio/covers/studio-detail-03.webp'],
   'Montrer un studio sans photographier des bureaux.',
   'Panoramas 360°, navigation WebGL, plan interactif.',
   'Une visite qu''on parcourt au lieu d''une page qu''on lit.',
   null, true),

  ('h-capital', '03', 'H Capital', 'published', 'upcoming', now(), 2,
   'Investissement', array['Portefeuilles', 'Sociétés cotées', 'IA'],
   null, null, null, null, null, '{}',
   null, null, null,
   'Une plateforme d''investissement : suivi de portefeuilles, recherche sur les sociétés cotées, le tout assisté par l''IA.',
   true),

  ('prochaine-realisation-04', '04', 'Prochaine réalisation', 'published', 'upcoming', now(), 3,
   'À venir', array['Stratégie', 'Design', 'Motion'],
   null, null, null, null, null, '{}', null, null, null, null, true),

  ('prochaine-realisation-05', '05', 'Prochaine réalisation', 'published', 'upcoming', now(), 4,
   'À venir', array['Exploration', 'Design', 'Développement'],
   null, null, null, null, null, '{}', null, null, null, null, true),

  ('votre-projet', '06', 'Votre projet', 'published', 'invitation', now(), 5,
   'Parlons-en', array['Stratégie', 'Design', 'Technologie'],
   '/contact', null, null, null, null, '{}', null, null, null, null, true);


-- ─────────────────────────────────────────────────────────────────────
-- BLOC 4/4 — Journal — article destiné aux conseillers en gestion de patrimoine
-- source : supabase/migrations/20260922140000_seed_cgp_article.sql
-- ─────────────────────────────────────────────────────────────────────

-- An article aimed at conseillers en gestion de patrimoine.
--
-- Seeded rather than typed into /admin/content because it is 1,400 words of
-- HTML and pasting that into an editor by hand is how a paragraph goes
-- missing. It is a normal post once inserted: editable, publishable and
-- deletable from the admin like any other, and dollar-quoted here so not a
-- single French apostrophe has to be escaped.
--
-- On what it claims: nothing about results, no figures, no timelines, no
-- prices. The regulatory paragraphs describe the French framework in general
-- terms and say in the article itself that they are not legal advice and
-- that the reader's association is the authority. Kanti is referenced
-- because it is already public on /projets, and only for what that page
-- already says about it.
--
-- on conflict do nothing: re-running migrations must not duplicate a post,
-- and must not silently overwrite one the owner has since edited.

insert into posts (
  slug, title, excerpt, body, cover_image_path, status, published_at,
  tag, date_label, reading_time, featured,
  meta_title, meta_description, author_name, client_display_name
) values (
  'site-internet-conseiller-gestion-patrimoine',
  'Site internet de CGP : ce que vos prospects vérifient avant de vous appeler',
  'Un cabinet de gestion de patrimoine ne se choisit pas comme un restaurant. Ce que votre site doit prouver, dans quel ordre, et pourquoi un beau site ne suffit pas.',
  $article$
<p>Un prospect qui cherche un conseiller en gestion de patrimoine ne compare pas des sites. Il cherche une raison de faire confiance à quelqu'un à qui il va parler d'argent, de famille et de succession. Votre site est le premier endroit où il la cherche, et il la cherche dans un ordre très précis.</p>

<p>Cet ordre est rarement celui dans lequel les sites de cabinet sont construits.</p>

<h2>Un site de CGP n'est pas un site vitrine</h2>

<p>Un site vitrine a un travail simple : montrer et séduire. Un site de cabinet patrimonial en a un autre, beaucoup plus exigeant : <strong>établir une légitimité avant d'établir une envie</strong>. Le visiteur n'arrive pas indécis entre vous et un concurrent. Il arrive méfiant, souvent mal informé sur ce que fait réellement un CGP, et parfois échaudé par un démarchage.</p>

<p>Ça change tout dans la hiérarchie de la page. Une photo de poignée de main et une phrase sur « votre avenir serein » ne répondent à aucune des questions qu'il se pose. Ce qu'il veut savoir tient en quatre points : qui vous êtes, si vous êtes autorisé à exercer, ce que vous faites exactement, et ce qui se passe s'il vous écrit.</p>

<h2>Ce qu'un prospect vérifie en premier : que vous existez vraiment</h2>

<p>La profession est encadrée, et vos prospects le savent de mieux en mieux. Beaucoup vérifient avant d'appeler : l'immatriculation ORIAS, le statut, l'association professionnelle agréée à laquelle vous adhérez, l'assurance de responsabilité civile professionnelle.</p>

<p>Ces informations existent dans tous les cabinets. Elles sont presque toujours reléguées dans les mentions légales, en bas de page, en gris clair. C'est une erreur de hiérarchie : ce sont vos éléments de preuve les plus forts, et ils sont rangés là où l'on met ce qu'on est obligé d'afficher.</p>

<p>Les remonter n'est pas un travail juridique, c'est un travail d'architecture de l'information. Un numéro d'immatriculation visible, vérifiable et daté vaut mieux que trois paragraphes sur votre engagement.</p>

<blockquote>Ce n'est pas un article de conformité. Les règles applicables à votre communication dépendent de votre statut et de votre association : c'est elle qui fait autorité, pas nous.</blockquote>

<h2>Dire ce que vous faites sans promettre ce que vous ne pouvez pas promettre</h2>

<p>C'est la contrainte propre au métier, et c'est aussi une contrainte de conception. Vous ne pouvez pas afficher de performance, pas garantir de résultat, pas mettre en avant un rendement. La tentation est alors de compenser par du vocabulaire : « optimisation », « sur-mesure », « accompagnement global », « approche 360 ». Des mots que tous vos concurrents utilisent aussi, et qui ne disent rien.</p>

<p>La sortie n'est pas d'en promettre plus. Elle est d'être <strong>plus concret sur le processus que sur le résultat</strong>. Ce que vous ne pouvez pas dire sur la performance, vous pouvez le dire sur la méthode : comment se déroule un premier rendez-vous, ce que vous regardez, en combien de temps, ce que le client reçoit, comment vous êtes rémunéré.</p>

<p>La transparence sur la méthode est le seul terrain où un cabinet peut se différencier sans rien promettre. C'est aussi, de loin, ce que les visiteurs lisent le plus.</p>

<h2>Structurer une offre qui est, par nature, complexe</h2>

<p>C'est le problème que nous avons rencontré en travaillant pour <a href="/projets">Kanti</a>, un cabinet de gestion de patrimoine : une offre réelle, sérieuse, et impossible à saisir d'un coup d'œil. Immobilier, placements financiers, transmission, fiscalité, retraite, protection du dirigeant — chaque brique est légitime, et mises côte à côte elles forment un mur.</p>

<p>Un visiteur ne lit pas un mur. Il cherche <em>son</em> cas : « je vends mon entreprise », « je viens d'hériter », « je prépare ma retraite ». Une offre organisée par produit oblige chaque prospect à traduire lui-même sa situation en catégorie — et la plupart ne font pas cet effort, ils partent.</p>

<p>L'arbitrage est donc souvent le même : présenter l'offre par <strong>situation de vie</strong> plutôt que par famille de produits, et garder la vue par produit pour ceux qui savent déjà ce qu'ils cherchent. Ce n'est pas un choix esthétique, c'est une décision d'architecture qui se prend avant la première maquette.</p>

<h2>Qualifier un contact plutôt que le collecter</h2>

<p>Un formulaire « Nom, e-mail, message » vous apporte des demandes que vous devrez qualifier au téléphone, une par une. Pour un cabinet dont le temps est la ressource rare, c'est le mauvais échange.</p>

<p>Quelques questions supplémentaires, posées correctement, changent la nature de ce qui arrive dans votre boîte : la situation, l'échéance, ce qui motive la démarche. Le prospect y répond volontiers — c'est même rassurant, parce que ça ressemble à un premier rendez-vous plutôt qu'à une prise de contact commerciale.</p>

<p>Deux règles pratiques : ne demandez jamais une information que vous n'utiliserez pas, et dites ce qui se passe ensuite. Un formulaire qui annonce la suite est rempli plus souvent qu'un formulaire qui se contente d'un bouton « Envoyer ».</p>

<h2>Ce que le référencement change pour un cabinet</h2>

<p>Un cabinet patrimonial n'a pas besoin de trafic. Il a besoin de <strong>quelques dizaines de bonnes personnes par an</strong>, ce qui est un objectif complètement différent — et beaucoup plus atteignable.</p>

<p>Les requêtes qui amènent un client ne sont presque jamais « gestion de patrimoine ». Ce sont des questions : que faire après la vente de son entreprise, comment préparer une succession, faut-il un CGP quand on n'est pas fortuné. Chacune est une page, et chaque page est une occasion d'être trouvé par quelqu'un qui a déjà le problème que vous savez traiter.</p>

<p>À cela s'ajoute la dimension locale. « Conseiller en gestion de patrimoine » suivi d'un nom de ville est une recherche à très forte intention, et elle se gagne avec des éléments concrets : une adresse réelle, une fiche d'établissement à jour, des pages qui parlent du territoire.</p>

<h2>Par où commencer</h2>

<p>Si vous avez déjà un site, trois questions suffisent à savoir s'il travaille pour vous :</p>

<ul>
  <li>Un visiteur peut-il vérifier votre statut sans aller dans les mentions légales ?</li>
  <li>Peut-il trouver sa propre situation en moins de trente secondes ?</li>
  <li>Sait-il ce qui se passe après avoir rempli le formulaire ?</li>
</ul>

<p>Trois « non » ne veulent pas dire qu'il faut tout refaire. Dans la plupart des cas, l'essentiel se joue sur l'organisation du contenu et sur la hiérarchie des preuves — pas sur le design.</p>

<p>C'est le travail que nous avons mené pour Kanti : structurer une offre patrimoniale complexe, pour aboutir à une expérience plus claire, cohérente et évolutive. Si vous êtes dans la même situation, <a href="/contact">parlez-nous de votre cabinet</a> : on revient avec une lecture du problème avant de parler design.</p>
$article$,
  'https://kov-agency.site/work/kanti-mockup.webp',
  'published',
  now(),
  'Gestion de patrimoine',
  'Septembre 2026',
  '6 min',
  false,
  'Site internet de CGP : ce que vos prospects vérifient | KOV',
  'Immatriculation, méthode, structuration de l''offre : ce qu''un prospect cherche sur le site d''un conseiller en gestion de patrimoine, et dans quel ordre.',
  'KOV',
  null
)
on conflict (slug) do nothing;
