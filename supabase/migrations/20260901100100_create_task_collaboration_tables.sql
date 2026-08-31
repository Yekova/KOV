-- Checklist, comments, and time tracking for project_tasks — the three
-- pieces the task detail panel needs beyond the bare task record. All
-- internal/admin-only, matching project_tasks' own convention: RLS
-- enabled, no policies/grants, all access via supabaseAdmin.

create table task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references project_tasks (id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index task_checklist_items_task_id_idx on task_checklist_items (task_id, position);
alter table task_checklist_items enable row level security;

comment on table task_checklist_items is
  'Checklist rows for a task. Progress (done/total) is computed at render time from these rows, not stored redundantly on project_tasks.';

create table task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references project_tasks (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index task_comments_task_id_idx on task_comments (task_id, created_at);
alter table task_comments enable row level security;

comment on table task_comments is
  '@Name mentions are detected against team member names at render/notify time, not stored as a separate relation — V1 scope. No reactions table either — kept to comment + edit + delete for a first version.';

create table task_time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references project_tasks (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  minutes integer,
  note text,
  created_at timestamptz not null default now()
);

create index task_time_entries_task_id_idx on task_time_entries (task_id);
create index task_time_entries_running_idx on task_time_entries (user_id) where ended_at is null;
alter table task_time_entries enable row level security;

comment on table task_time_entries is
  'One row per timer session (live: started_at set, ended_at null while running) or manual entry (both timestamps set immediately). One running timer per user at a time is enforced in the server action, not the DB — starting a new one auto-stops any other still-running entry for that user_id.';
