create table project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'blocked')),
  assigned_to uuid references profiles (id) on delete set null,
  priority text check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_tasks_project_id_idx on project_tasks (project_id);
create index project_tasks_assigned_status_idx on project_tasks (assigned_to, status);
create index project_tasks_status_due_idx on project_tasks (status, due_date);

alter table project_tasks enable row level security;

-- Deliberately NO select policy and NO grant to authenticated at all.
-- Unlike every other table in this schema, project_tasks has no client-facing
-- read path whatsoever — clients never see internal tasks. This is a true
-- deny-all; do not copy-paste a "clients can read their own X" grant here.
