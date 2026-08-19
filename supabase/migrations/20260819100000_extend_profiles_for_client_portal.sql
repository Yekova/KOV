alter table profiles
  add column account_manager_id uuid references profiles (id) on delete set null,
  add column display_title text,
  add column avatar_path text,
  add column is_online boolean not null default false,
  add column email text;

create index profiles_account_manager_id_idx on profiles (account_manager_id);

comment on column profiles.account_manager_id is
  'Client-facing: this client''s primary KOV contact (one PM per client relationship, not per project). Only meaningful when the referenced row has role = ''admin'' — not enforced by a DB constraint, matching this table''s existing "app code enforces, RLS is defense-in-depth" convention (see requireAdmin()).';
comment on column profiles.display_title is 'Client-facing job title (e.g. "Directeur de projet"). Only set for role = ''admin'' rows. Set manually per admin account — no self-service UI in this pass.';
comment on column profiles.avatar_path is 'Object key in the public "portal-assets" bucket. Null until a real photo is uploaded.';
comment on column profiles.is_online is 'Manually toggled by the admin themselves — NOT real presence detection. Deliberate v1 simplification.';
comment on column profiles.email is 'Denormalized from auth.users for admin list/search convenience, kept in sync by handle_new_user() below. Source of truth remains auth.users.email.';

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

grant select (account_manager_id, display_title, avatar_path, is_online, email) on profiles to authenticated;
