-- Fixes a gap from 20260901120000_extend_posts_for_rich_articles.sql: the
-- admin content form (PostForm.tsx) and its actions (admin/content/actions.ts)
-- have always read/written a free-text `date_label` column (the manually-set
-- display date shown on a post, independent of the real `published_at`
-- timestamp) but no migration ever created it — createPost()/updatePost()
-- fail outright without this column.
alter table posts
  add column date_label text;
