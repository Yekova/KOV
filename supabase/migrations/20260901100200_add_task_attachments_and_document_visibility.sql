-- Task attachments reuse the existing documents table rather than a
-- parallel one — it already has storage/upload/preview/download plumbing
-- built (src/lib/portal/storage.ts), no reason to duplicate it.
alter table documents
  add column task_id uuid references project_tasks (id) on delete cascade,
  add column visibility text not null default 'client' check (visibility in ('internal', 'client'));

create index documents_task_id_idx on documents (task_id);

comment on column documents.task_id is
  'Set when a document is a task attachment (uploaded from the task detail panel) rather than a general project/client file. Nullable — most documents are not task attachments.';
comment on column documents.visibility is
  'A real gap until now: every document was unconditionally client-visible via RLS, with no way to mark one internal-only. Task attachments default to internal (see the RLS policy update below); every pre-existing upload path keeps defaulting to client, so no behavior change for the GED/client portal as it exists today.';

-- Tighten the existing client-read policy to also require visibility =
-- 'client' — internal documents (task attachments, by default) never
-- become readable through this path no matter what client_id says.
drop policy "Clients can read their own documents" on documents;
create policy "Clients can read their own documents"
  on documents for select to authenticated
  using (client_id = auth.uid() and visibility = 'client');
