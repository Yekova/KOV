-- Quotes were admin-only in the first phase (see 20260821130000). Clients
-- now get their own read-only /client/quotes page, so they need to be able
-- to read quotes addressed to them — same defense-in-depth convention as
-- every other client-facing table (supabaseAdmin bypasses this in the app
-- code either way, app-level ownership checks are the real gate).
create policy "Clients can read their own quotes"
  on quotes for select to authenticated using (client_id = auth.uid());

grant select on quotes to authenticated;
