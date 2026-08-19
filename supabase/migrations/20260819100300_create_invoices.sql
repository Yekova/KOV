create table invoices (
  id uuid primary key default gen_random_uuid(),
  -- on delete restrict: invoice records must outlive a deleted client account
  -- (legal retention), unlike everything else here which cascades.
  client_id uuid not null references profiles (id) on delete restrict,
  project_id uuid references projects (id) on delete set null,
  reference text not null unique, -- e.g. "F-2025-05"
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'EUR',
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'overdue')),
  pdf_storage_path text, -- object key in the private "client-files" bucket
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create index invoices_client_id_idx on invoices (client_id, issued_at desc);

alter table invoices enable row level security;

create policy "Clients can read their own invoices"
  on invoices for select to authenticated using (client_id = auth.uid());

grant select on invoices to authenticated;
