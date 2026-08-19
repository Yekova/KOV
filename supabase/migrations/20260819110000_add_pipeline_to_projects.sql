alter table projects
  add column pipeline_stage text not null default 'discovery'
    check (pipeline_stage in ('discovery', 'proposal', 'production', 'review', 'delivery')),
  add column project_manager_id uuid references profiles (id) on delete set null,
  add column budget_cents integer check (budget_cents >= 0),
  add column currency text not null default 'EUR',
  add column description text,
  add column priority text check (priority in ('low', 'medium', 'high'));

create index projects_project_manager_id_idx on projects (project_manager_id);
create index projects_pipeline_stage_idx on projects (pipeline_stage);

comment on column projects.pipeline_stage is
  'Internal sales/delivery funnel position (discovery/proposal/production/review/delivery) — distinct from the client-facing `status` column, which the client portal dashboard already depends on unchanged. Deliberately not reusing "in_progress" as a value (that string already means something different on `status`).';
comment on column projects.project_manager_id is
  'Per-project manager — distinct from profiles.account_manager_id, which is the client''s overall KOV contact. Not DB-enforced to role=admin, matching this schema''s existing "app code enforces" convention.';
