create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'admin')),
  full_name text,
  company text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- A signed-in user may read their own profile row.
-- NOTE: same platform-quirk caveat documented in 20260818120000_create_leads.sql
-- applies until proven otherwise on this project. This policy is defense-in-depth
-- only — src/proxy.ts and src/app/admin/page.tsx do NOT rely on it; they read
-- `role` via the service-role client (src/lib/supabaseAdmin.ts), which bypasses
-- RLS entirely and cannot be affected by the quirk either way.
create policy "Users can read own profile"
  on profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- A signed-in user may update their own non-role fields. Column-level grants
-- below deliberately exclude `role` and `id`, so even if this policy's
-- WITH CHECK is satisfied, a user cannot UPDATE their own row's `role` column
-- via the anon-key client — there is no self-service privilege escalation path.
create policy "Users can update own profile"
  on profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select on profiles to authenticated;
grant update (full_name, company, updated_at) on profiles to authenticated;

-- Auto-create a profile row whenever a new auth.users row is created
-- (standard Supabase "handle_new_user" pattern).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();
