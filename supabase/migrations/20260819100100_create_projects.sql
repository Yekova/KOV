create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  category text not null, -- freeform display label, not branching logic — no enum needed
  status text not null default 'in_progress'
    check (status in ('in_progress', 'in_review', 'done', 'on_hold')),
  progress_percent integer not null default 0
    check (progress_percent between 0 and 100),
  thumbnail_path text, -- object key in the public "portal-assets" bucket
  next_deadline_date date,
  deadline_phase_label text, -- e.g. "Phase de développement"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_client_id_idx on projects (client_id);
create index projects_client_deadline_idx on projects (client_id, next_deadline_date)
  where next_deadline_date is not null;

-- status <-> French label mapping lives in src/lib/portal/status.ts, not the DB:
--   in_progress -> "En cours" | in_review -> "En validation"
--   done -> "Terminés"       | on_hold -> "En attente"

alter table projects enable row level security;

create policy "Clients can read their own projects"
  on projects for select to authenticated using (client_id = auth.uid());

grant select on projects to authenticated;
