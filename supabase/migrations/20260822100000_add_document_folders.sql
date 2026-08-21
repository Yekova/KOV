create table document_folders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  client_id uuid not null references profiles (id) on delete cascade, -- denormalized from projects.client_id, same convention as documents.client_id
  parent_folder_id uuid references document_folders (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index document_folders_project_idx on document_folders (project_id, parent_folder_id);
create index document_folders_client_idx on document_folders (client_id);

-- Two partial unique indexes instead of one plain unique constraint: Postgres
-- treats NULL <> NULL, so a single unique(project_id, parent_folder_id, name)
-- would let root-level folders (parent_folder_id is null) duplicate names.
create unique index document_folders_root_unique_idx
  on document_folders (project_id, name) where parent_folder_id is null;
create unique index document_folders_child_unique_idx
  on document_folders (project_id, parent_folder_id, name) where parent_folder_id is not null;

alter table document_folders enable row level security;

create policy "Clients can read their own project folders"
  on document_folders for select to authenticated using (client_id = auth.uid());

grant select on document_folders to authenticated;

alter table documents
  add column folder_id uuid references document_folders (id) on delete set null,
  add column mime_type text,
  add column size_bytes bigint;

create index documents_folder_idx on documents (folder_id);

comment on column documents.folder_id is
  'GED folder this document lives in — null means the project root. See document_folders.';
comment on column documents.mime_type is
  'Browser-reported File.type at upload time — used to pick a preview (image/pdf) vs a generic icon.';
