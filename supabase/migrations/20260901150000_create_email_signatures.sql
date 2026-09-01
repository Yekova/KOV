-- Replaces profiles.email_signature (a single HTML-snippet column added in
-- the Lead Workspace DB pass) with a real per-user, multi-signature table —
-- the email module spec explicitly wants named signatures with a default
-- flag and a picker in the composer. Safe to drop the old column outright:
-- nothing in production has set it yet (the composer that would have used
-- it doesn't exist until this pass).
create table email_signatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  content text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table email_signatures is
  'Admin-editable HTML signatures, one admin can have several — see the composer''s signature picker. At most one is_default = true per user_id, enforced in application code (createSignature/setDefaultSignature), not a DB constraint.';

create index email_signatures_user_id_idx on email_signatures (user_id);

alter table email_signatures enable row level security;
-- Admin-only, no select policy/grant — same convention as project_tasks:
-- every read goes through supabaseAdmin from a requireAdmin()-gated route.

alter table profiles drop column email_signature;
