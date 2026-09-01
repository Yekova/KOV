-- Leads Workspace spec, section 24: "Créer une tâche depuis un lead" with
-- an optional project. project_tasks.project_id was NOT NULL (every task
-- belonged to a project) — this relaxes that and adds lead_id as the
-- alternative anchor, with a check ensuring a task always has at least one.
alter table project_tasks alter column project_id drop not null;
alter table project_tasks add column lead_id uuid references leads (id) on delete cascade;
alter table project_tasks add constraint project_tasks_project_or_lead_check
  check (project_id is not null or lead_id is not null);

create index project_tasks_lead_id_idx on project_tasks (lead_id);

comment on column project_tasks.lead_id is
  'Set for a task created from a lead''s fiche before any project exists (e.g. "Relancer Jean Dupont demain"). Mutually optional with project_id, not both null.';
