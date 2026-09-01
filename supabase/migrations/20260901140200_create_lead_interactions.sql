-- The lead-side equivalent of activity_log — a dedicated table, not a
-- reuse of activity_log, because activity_log.client_id is NOT NULL and a
-- lead has no profiles row until it converts. See logLeadInteraction()
-- (src/lib/leads/interactions.ts) for the single write path.
create table lead_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  type text not null check (type in ('email', 'phone', 'meeting', 'note', 'form', 'proposal', 'follow_up', 'status_change')),
  actor_id uuid references profiles (id) on delete set null,
  content text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table lead_interactions is
  'Full interaction timeline per lead — see /admin/leads/[id]. actor_id is null for system-generated entries (e.g. the initial "form" entry from the public contact form).';
comment on column lead_interactions.metadata is
  'Type-specific structured data — e.g. {"from_status": "new", "to_status": "qualified"} for status_change, {"email_log_id": "..."} for email.';

create index lead_interactions_lead_id_idx on lead_interactions (lead_id, created_at desc);

alter table lead_interactions enable row level security;
-- Admin-only, no select policy/grant — same convention as project_tasks.
