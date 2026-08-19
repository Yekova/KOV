alter table activity_log
  add column actor_id uuid references profiles (id) on delete set null,
  add column admin_title text;

create index activity_log_created_at_idx on activity_log (created_at desc);

comment on column activity_log.actor_id is
  'Who performed the action. Nullable + on delete set null: the sentence in title/admin_title survives even if the actor''s account is later removed (matches the existing "snapshot, don''t live-join" philosophy on this table).';
comment on column activity_log.admin_title is
  'A second, separately-phrased sentence for the agency-wide admin feed (e.g. "Quentin M. a mis à jour le projet Refonte Onyx"), distinct from the existing client-facing `title` (e.g. "Statut de projet mis à jour") — the two audiences need different phrasing for the same event. Nullable for backward compatibility with pre-existing rows; render `admin_title ?? title` with a generic "Équipe KOV" actor fallback when rendering the admin feed for old rows.';
