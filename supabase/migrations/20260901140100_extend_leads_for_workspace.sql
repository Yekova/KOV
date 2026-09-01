-- Leads Workspace spec, sections 6/7/13/14/27/28/44. `name` stays as-is
-- (the public contact form only ever submits one combined field and must
-- keep working unmodified) — first_name/last_name are a new, separate,
-- admin-correctable structured source used by the email personalization
-- engine, backfilled below from the existing `name` on the 2 live rows.
alter table leads
  add column title text check (title in ('M.', 'Mme', 'Dr', 'Autre')),
  add column first_name text,
  add column last_name text,
  add column job_title text,
  add column website text,
  add column linkedin_url text,
  add column score integer check (score >= 0 and score <= 100),
  add column tags text[] not null default '{}',
  add column next_action_note text,
  add column next_action_date date,
  add column next_action_owner_id uuid references profiles (id) on delete set null,
  add column last_contacted_at timestamptz,
  add column consent_status text not null default 'unknown' check (consent_status in ('given', 'withdrawn', 'unknown')),
  add column consent_source text,
  add column consent_at timestamptz,
  add column marketing_opt_in boolean not null default false;

comment on column leads.title is 'Civilité — never inferred from first_name, must be entered explicitly. Null = "Non renseigné" in the UI.';
comment on column leads.score is 'Recomputed by src/lib/leads/scoring.ts after status changes / interactions — not maintained by a DB trigger, see that module for the current factors.';
comment on column leads.tags is 'Free-form, admin-managed — same array-column convention as posts.related_post_ids, no separate tags table needed for a single-entity, non-shared tag list.';

-- Naive split (first token / remainder) — good enough for a one-time
-- backfill of the 2 rows that exist today; the admin can correct any
-- edge case (compound first names, etc.) from the lead's edit form.
update leads set
  first_name = split_part(name, ' ', 1),
  last_name = nullif(trim(substring(name from length(split_part(name, ' ', 1)) + 2)), '')
where first_name is null;

create index leads_score_idx on leads (score);
create index leads_next_action_date_idx on leads (next_action_date) where next_action_date is not null;
