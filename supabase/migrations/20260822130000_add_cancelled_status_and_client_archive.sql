alter table invoices drop constraint invoices_status_check;
alter table invoices add constraint invoices_status_check
  check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled'));

alter table quotes drop constraint quotes_status_check;
alter table quotes add constraint quotes_status_check
  check (status in ('draft', 'sent', 'accepted', 'declined', 'expired', 'cancelled'));

-- Soft-delete for clients: hard-deleting a profiles row cascades across
-- projects/documents/quotes and is blocked outright for invoices (on delete
-- restrict, see 20260819100300_create_invoices.sql) — archiving instead
-- keeps every historical record intact and just hides the client from the
-- default admin list.
alter table profiles add column archived_at timestamptz;

comment on column profiles.archived_at is
  'Set when an admin archives a client — hides them from the default client list without touching their history.';
