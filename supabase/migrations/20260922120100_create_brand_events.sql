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
