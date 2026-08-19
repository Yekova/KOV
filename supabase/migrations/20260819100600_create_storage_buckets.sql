insert into storage.buckets (id, name, public)
values ('portal-assets', 'portal-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('client-files', 'client-files', false)
on conflict (id) do nothing;

-- Deliberately no storage.objects RLS policies:
--  - portal-assets is public (reads bypass RLS entirely); the only writes
--    are via supabaseAdmin.storage from requireAdmin()-gated Server Actions,
--    so no client-side write path exists to police.
--  - client-files is private, but there is likewise no direct-from-browser
--    read/write path to defend — every access goes through supabaseAdmin.storage,
--    with a manual client_id === user.id check before minting a signed URL.
--    Given the documented platform RLS-policy bug affecting this project
--    (see leads/profiles migrations), we leave storage.objects at its default
--    deny-all rather than write untested policies for a path that doesn't exist.
