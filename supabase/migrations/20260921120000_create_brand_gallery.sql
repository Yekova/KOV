-- The Brand Gallery's occupants.
--
-- One row is one stand in the walkable room (studio node P04). Nothing
-- about the room's architecture lives here: the shell, the plinths and the
-- lighting are geometry in the code, and a row only says which of the
-- room's positions a brand occupies and what it shows there.
--
-- Read publicly, written by the service role. The gallery is a marketing
-- surface — a visitor's browser fetches active rows directly with the anon
-- key, and only the back office writes.

create table brand_gallery (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  slug text not null unique,
  description text,

  -- Assets. All four are URLs into storage buckets this project controls;
  -- nothing here is ever rendered as markup, and the client validates the
  -- origin before it loads any of them (see src/lib/studio/brands.ts).
  logo_url text,
  cover_url text,
  video_url text,
  model_url text,
  website_url text,

  -- Where in the room. Metres, in the scene's own coordinates, and
  -- authored with the in-scene editor rather than guessed — the floor runs
  -- roughly -9..9 on x and -16..4 on z.
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  position_z double precision not null default 0,
  rotation_y double precision not null default 0,
  scale double precision not null default 1,

  -- What the stand is allowed to show. The room reads this to decide
  -- whether to build a plinth, a screen or a volume — it is a capability,
  -- not a price. No pricing lives in this schema: there is no tariff yet,
  -- and inventing a column for one would be inventing the offer.
  tier text not null default 'presence'
    check (tier in ('presence', 'showcase', 'immersive', 'exclusive')),

  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  is_featured boolean not null default false,

  -- Optional run. Null on either side means "no bound on that side"; the
  -- read path treats both as inclusive.
  start_date timestamptz,
  end_date timestamptz
);

-- The gallery's only query: active rows whose window is open, in placement
-- order. Indexed for exactly that.
create index brand_gallery_live_idx on brand_gallery (status, start_date, end_date);

alter table brand_gallery enable row level security;

-- Only what is live is readable. A draft or an expired stand is not
-- "hidden by the client" — it never leaves the database.
create policy "Public can read live brands"
  on brand_gallery
  for select
  to public
  using (
    status = 'active'
    and (start_date is null or start_date <= now())
    and (end_date is null or end_date >= now())
  );

grant select on brand_gallery to anon, authenticated, public;

create or replace function set_brand_gallery_updated_at()
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

create trigger brand_gallery_updated_at
  before update on brand_gallery
  for each row
  execute function set_brand_gallery_updated_at();
