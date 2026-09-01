-- One signature per admin, editable from /admin/settings — Leads Workspace
-- spec, section 18. A dedicated table would be overkill for a single
-- HTML-snippet field with no other attributes.
alter table profiles add column email_signature text;

comment on column profiles.email_signature is
  'HTML snippet appended by the email composer — admin-editable, defaults to null (no signature inserted) until set.';
