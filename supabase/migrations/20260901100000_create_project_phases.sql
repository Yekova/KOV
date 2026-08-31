-- Project phases (Discovery/Structure/Design/... in KOV's own process) as a
-- real relational concept, replacing the free-text projects.deadline_phase_label
-- for anything phase-related going forward. deadline_phase_label itself is
-- left untouched — unrelated to this new system, not migrated/removed.
create table project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'review', 'completed', 'blocked')),
  position integer not null default 0,
  start_date date,
  due_date date,
  owner_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_phases_project_id_idx on project_phases (project_id, position);

alter table project_phases enable row level security;
-- No policies/grants — internal-only, same convention as project_tasks
-- (see its own migration comment): all access via supabaseAdmin from
-- requireAdmin()-gated server actions, true deny-all for any other client.

comment on table project_phases is
  'Real phase tracking for a project (Discovery/Structure/Design/Development/Motion/Launch/Evolution is KOV''s own example set, not hardcoded here — phases are created per project). Internal/admin-only, no client visibility yet.';

-- Extend project_tasks to reference a phase and support the vocabulary a
-- real task manager needs (Kanban ordering, estimation, authorship,
-- client-validation state). Existing columns/rows are untouched.
alter table project_tasks
  add column phase_id uuid references project_phases (id) on delete set null,
  add column position integer not null default 0,
  add column estimated_minutes integer check (estimated_minutes >= 0),
  add column created_by uuid references profiles (id) on delete set null,
  add column validation_status text not null default 'not_required'
    check (validation_status in ('not_required', 'internal_review', 'client_review', 'approved', 'changes_requested'));

create index project_tasks_phase_id_idx on project_tasks (phase_id);

comment on column project_tasks.position is
  'Ordering within a status column on the Kanban board — not a global ordering, just relative to siblings sharing the same status.';
comment on column project_tasks.validation_status is
  'Separate from status: a task can be "in_progress" (workflow position) and simultaneously waiting on "client_review" (approval state) at once. not_required is the default — most tasks never need a validation flow.';

-- Widen status/priority to the fuller vocabulary a real task manager needs.
-- NOTE: verify these constraint names against the live schema before
-- running — Postgres names an inline column check "<table>_<column>_check"
-- by default with no explicit name given, which is what the original
-- 20260819110300_create_project_tasks.sql migration relied on, but confirm
-- with \d project_tasks (or the Supabase dashboard) first.
alter table project_tasks drop constraint project_tasks_status_check;
alter table project_tasks add constraint project_tasks_status_check
  check (status in ('backlog', 'todo', 'in_progress', 'in_review', 'client_review', 'blocked', 'done'));

alter table project_tasks drop constraint project_tasks_priority_check;
alter table project_tasks add constraint project_tasks_priority_check
  check (priority in ('low', 'medium', 'high', 'urgent'));

comment on column project_tasks.status is
  'Kanban only shows 5 columns (backlog/todo/in_progress/in_review/done) — blocked and client_review render as a badge on the card instead of their own column, since a task can be "in review" and "blocked" at once, which a single column position can''t express.';
