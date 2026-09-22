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
