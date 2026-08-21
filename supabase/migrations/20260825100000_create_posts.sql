-- Journal / case studies, admin-authored, publicly readable once published.
-- project_id is an internal reference only (lets the admin browse "case
-- studies about this project" from /admin/projects/[id] later) — it is
-- deliberately never joined against profiles when rendering a public post.
-- client_display_name is a separate, free-text field the admin fills in by
-- hand, so a client's real CRM identity (name/email/company in profiles)
-- can never leak onto the public internet just because a case study
-- happens to reference their project.
create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  cover_image_path text,
  client_display_name text,
  project_id uuid references projects(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table posts is
  'Admin-authored blog/case-study content for the public /journal pages. See /admin/content.';

create index posts_status_published_at_idx on posts (status, published_at desc);
create index posts_project_id_idx on posts (project_id);

alter table posts enable row level security;

-- Public can read published posts (matches quotes' "clients read their own
-- rows" convention — a real non-admin consumer exists here, unlike
-- business_settings which is admin-only end to end). All writes go through
-- supabaseAdmin from /admin/content, so no insert/update/delete policy.
create policy "Public can read published posts" on posts
  for select using (status = 'published');
