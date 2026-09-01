-- Extends the existing journal `posts` table (see 20260825100000_create_posts.sql)
-- with the richer article model requested for the new backoffice — tag,
-- reading time, featured flag, SEO fields, audio, related articles,
-- manual ordering, and view/like counters. Deliberately NOT a new/parallel
-- table: same posts, same /admin/content routes, same /journal public
-- pages, just a richer editing surface on top.
--
-- `body` stays `text` (no schema change) — it already stores whatever
-- string the admin saved; it will now hold TipTap-generated HTML instead
-- of the old plain-text-paragraphs-split-by-blank-lines format. Existing
-- rows' plain-text bodies remain valid HTML too (bare text is valid inside
-- a container), they just won't have any rich formatting until re-edited.
alter table posts
  add column tag text,
  add column reading_time text,
  add column featured boolean not null default false,
  add column meta_title text,
  add column meta_description text,
  add column author_name text,
  add column audio_url text,
  add column related_post_ids uuid[] not null default '{}',
  add column sort_order integer,
  add column views integer not null default 0,
  add column likes integer not null default 0;

comment on column posts.related_post_ids is
  'Up to 3 related post IDs, app-enforced (no DB constraint) — order is meaningful (display order), not validated as existing/published posts at the DB level.';
comment on column posts.sort_order is
  'Manual ordering for the admin list (see reorderPosts) — null until the admin first reorders, same "assign index-based values on first use" pattern as project_tasks.position.';

create index posts_featured_idx on posts (featured) where featured = true;

-- Real view counting from the public post page — no admin UI increments
-- this except through an actual page view. No corresponding "like" button
-- exists yet in the public UI, so `likes`/toggle_post_like exist for a
-- future pass but are never called today.
create or replace function increment_post_views(post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update posts set views = views + 1 where id = post_id;
$$;

create or replace function toggle_post_like(post_id uuid, delta integer)
returns void
language sql
security definer
set search_path = public
as $$
  update posts set likes = greatest(0, likes + delta) where id = post_id;
$$;

-- Both are SECURITY DEFINER so an anonymous visitor's RLS-less anon-key
-- call can still bump a counter despite posts having no public update
-- policy — same rationale as any public "increment a counter" RPC: the
-- function does exactly one narrow, harmless thing, nothing else is opened up.
grant execute on function increment_post_views(uuid) to anon, authenticated;
grant execute on function toggle_post_like(uuid, integer) to anon, authenticated;
