-- Email module spec: templates track who last edited them (created_by
-- already existed) and can be starred for the composer's template picker.
alter table email_templates
  add column updated_by uuid references profiles (id) on delete set null,
  add column is_favorite boolean not null default false;

comment on column email_templates.is_favorite is
  'Starred templates surface first in the composer''s picker — per-workspace, not per-user (small admin team, no need for per-user favorites yet).';

-- email_logs: body_text is the plain-text fallback part of the send
-- (multipart email — some clients/spam filters prefer it present).
-- delivered_at/failed_at complete the lifecycle timestamps started with
-- sent_at/opened_at/clicked_at. conversation_id groups a send with its
-- eventual reply/follow-up sends into one thread — every row gets its own
-- fresh id by default (starts its own conversation), a reply is inserted
-- with the SAME conversation_id as the email it follows. No full inbox/
-- reply-ingestion in this pass — this only lays the column down.
alter table email_logs
  add column body_text text,
  add column delivered_at timestamptz,
  add column failed_at timestamptz,
  add column conversation_id uuid not null default gen_random_uuid();

create index email_logs_conversation_id_idx on email_logs (conversation_id);
