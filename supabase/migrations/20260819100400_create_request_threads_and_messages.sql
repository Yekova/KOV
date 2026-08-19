create table request_threads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  subject text not null,
  status text not null default 'open'
    check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table request_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references request_threads (id) on delete cascade,
  client_id uuid not null references profiles (id) on delete cascade, -- denormalized for simple RLS/queries
  body text not null,
  created_by text not null check (created_by in ('client', 'admin')),
  author_admin_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index request_threads_client_id_idx on request_threads (client_id, updated_at desc);
create index request_messages_thread_id_idx on request_messages (thread_id, created_at);
create index request_messages_client_id_idx on request_messages (client_id, created_at desc);

alter table request_threads enable row level security;
alter table request_messages enable row level security;

create policy "Clients can read their own request threads"
  on request_threads for select to authenticated using (client_id = auth.uid());
create policy "Clients can read their own request messages"
  on request_messages for select to authenticated using (client_id = auth.uid());

grant select on request_threads to authenticated;
grant select on request_messages to authenticated;
