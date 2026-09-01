-- Every email sent from a lead's fiche — see /admin/leads/[id]'s "Emails"
-- section (Leads Workspace spec, sections 20/21). template_id is nullable
-- (a "10 — Personnalisé" send has no template); lead_id is nullable too so
-- this table can later log emails sent to converted clients without a
-- schema change, though nothing writes that path yet.
create table email_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  template_id uuid references email_templates (id) on delete set null,
  sender_id uuid references profiles (id) on delete set null,
  recipient text not null,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'queued', 'sent', 'delivered', 'failed', 'bounced')),
  provider_message_id text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table email_logs is
  'body is the final rendered HTML actually sent (variables already substituted) — a durable record independent of later template edits.';
comment on column email_logs.opened_at is
  'Only ever set if the provider supports open tracking and the recipient''s client loads remote images — never treat as 100% reliable (Brevo: opt-in tracking pixel).';

create index email_logs_lead_id_idx on email_logs (lead_id, created_at desc);
create index email_logs_status_idx on email_logs (status);

alter table email_logs enable row level security;
-- Admin-only, no select policy/grant — same convention as project_tasks.
