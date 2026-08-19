create table activity_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  type text not null check (type in ('document', 'message', 'invoice', 'milestone')),
  title text not null,        -- snapshotted at insert time (e.g. "Message de Quentin") —
  description text,           -- deliberately not live-joined, so this reads as a point-in-time record
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index activity_log_client_feed_idx on activity_log (client_id, created_at desc);
create index activity_log_client_unread_idx on activity_log (client_id) where read_at is null;

alter table activity_log enable row level security;

create policy "Clients can read their own activity"
  on activity_log for select to authenticated using (client_id = auth.uid());

grant select on activity_log to authenticated;
