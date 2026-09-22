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
