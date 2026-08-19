create table documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  filename text not null,
  storage_path text not null, -- object key in the private "client-files" bucket
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index documents_client_id_idx on documents (client_id, created_at desc);
create index documents_project_id_idx on documents (project_id);

alter table documents enable row level security;

create policy "Clients can read their own documents"
  on documents for select to authenticated using (client_id = auth.uid());

grant select on documents to authenticated;
