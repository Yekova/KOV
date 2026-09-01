-- Makes the lead pipeline's stages admin-configurable (add/rename/reorder
-- from /admin/settings) instead of the hardcoded TS union every other
-- status enum in this schema uses (quotes, invoices, tasks). This is a
-- deliberate one-off exception, not a new house style — see the Leads
-- Workspace spec, section 4.
--
-- `won` and `lost` are protected/seeded rows: dashboard KPIs, the funnel,
-- and convertLeadToClient() all key off status = 'won'/'lost' literally.
-- The admin can rename their labels/colors but the app does not support
-- deleting these two keys — enforced at the application layer (server
-- action), not the database, same as every other admin-only guard in
-- this schema.
create table lead_statuses (
  key text primary key,
  label text not null,
  color text not null,
  position integer not null,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  is_protected boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table lead_statuses is
  'Admin-configurable lead pipeline stages — see /admin/settings/lead-statuses. is_protected rows (won/lost) cannot be deleted from the UI.';
comment on column lead_statuses.is_won is 'Exactly one row should carry this — the terminal "converted" stage convertLeadToClient() sets leads.status to.';
comment on column lead_statuses.is_lost is 'Exactly one row should carry this — the terminal "lost" stage, reachable from any stage in the Kanban.';

insert into lead_statuses (key, label, color, position, is_won, is_lost, is_protected) values
  ('new', 'Nouveau', '#7C7C7A', 0, false, false, false),
  ('contacted', 'Contacté', '#3F8CFF', 1, false, false, false),
  ('qualified', 'Qualifié', '#9B6DFF', 2, false, false, false),
  ('proposal', 'Proposition', '#E39A2D', 3, false, false, false),
  ('negotiation', 'Négociation', '#E3B02D', 4, false, false, false),
  ('dormant', 'En sommeil', '#5A5A58', 5, false, false, false),
  ('won', 'Gagné', '#3FB27F', 6, true, false, true),
  ('lost', 'Perdu', '#E31E24', 7, false, true, true);

alter table lead_statuses enable row level security;
-- Admin-only, no select policy/grant — same convention as project_tasks:
-- every read goes through supabaseAdmin from a requireAdmin()-gated route.

-- Replace the fixed CHECK on leads.status with a real foreign key into the
-- new lookup table, so adding a status from settings actually makes it a
-- valid value instead of requiring a schema migration every time.
alter table leads drop constraint leads_status_check;
alter table leads add constraint leads_status_fkey foreign key (status) references lead_statuses (key);
