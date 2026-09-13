alter table profiles
  add column ms_refresh_token text,
  add column ms_connected_email text,
  add column ms_connected_at timestamptz;

comment on column profiles.ms_refresh_token is
  'OAuth2 refresh token for Microsoft Graph delegated send (Mail.Send) — lets this admin''s outbound CRM emails (lead replies, invoices, quotes) go out from their real Outlook/Microsoft 365 mailbox instead of the shared Brevo sender. Only ever set on role=admin rows; read/written exclusively via supabaseAdmin, same as every other admin-only column in this schema.';
comment on column profiles.ms_connected_email is
  'The Outlook/Microsoft 365 address this admin connected, shown back to them in Paramètres so they can see which mailbox is wired up.';
comment on column profiles.ms_connected_at is
  'When this admin last completed the Microsoft OAuth connection — shown in Paramètres, cleared on disconnect.';
