alter table invoices
  add column paid_at timestamptz,
  add constraint invoices_paid_at_matches_status
    check ((status = 'paid') = (paid_at is not null));

-- Backfill: any invoice already marked paid before this migration existed
-- gets issued_at as its paid_at, rather than silently vanishing from every
-- paid_at-based revenue query going forward.
update invoices set paid_at = issued_at where status = 'paid' and paid_at is null;

create index invoices_paid_at_idx on invoices (paid_at) where status = 'paid';
