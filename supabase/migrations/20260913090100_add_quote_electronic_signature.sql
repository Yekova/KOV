alter table quotes
  add column yousign_request_id text,
  add column yousign_signer_id text,
  add column signing_url text,
  add column signed_at timestamptz,
  add column signed_pdf_storage_path text;

comment on column quotes.yousign_request_id is
  'Yousign signature_request id once an admin has requested an electronic signature for this quote — null means no signature has ever been requested.';
comment on column quotes.yousign_signer_id is
  'Yousign signer id for the client on this signature request — needed to verify/match incoming webhook events.';
comment on column quotes.signing_url is
  'The client''s real Yousign signing link, shown as "Signer le devis" in their portal. Not a preview/mock link — visiting it opens the actual eIDAS-compliant signing flow.';
comment on column quotes.signed_at is
  'Set only by the Yousign webhook once the client has actually completed signing — never set optimistically from the admin side.';
comment on column quotes.signed_pdf_storage_path is
  'The final signed PDF (carrying Yousign''s audit trail/certificate) downloaded from Yousign after completion and stored in our own bucket, same convention as quotes.pdf_storage_path/invoices.pdf_storage_path.';
