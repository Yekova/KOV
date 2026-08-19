alter table leads
  add column company text,
  add column project_type text,
  add column budget_cents integer check (budget_cents >= 0),
  add column timeline text,
  add column assigned_to uuid references profiles (id) on delete set null,
  add column updated_at timestamptz not null default now();

create index leads_created_at_idx on leads (created_at desc);
create index leads_assigned_to_idx on leads (assigned_to);

-- All new columns are nullable — the public contact form
-- (src/app/api/contact/route.ts) only ever sets name/email/phone/message/source
-- and must keep working completely unmodified.
