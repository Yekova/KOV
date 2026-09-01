import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolvePostImageUrl } from "@/lib/portal/storage";
import { PostView } from "@/components/journal/PostView";

export async function generateMetadata(props: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("title, excerpt, meta_title, meta_description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) return { title: "Journal — KOV" };
  return {
    title: post.meta_title || `${post.title} — KOV`,
    description: post.meta_description || post.excerpt || undefined,
    alternates: { canonical: `https://kov-agency.site/journal/${slug}` },
  };
}

export default async function JournalPostPage(props: PageProps<"/journal/[slug]">) {
  const { slug } = await props.params;

  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("id, title, body, cover_image_path, client_display_name, published_at, tag, reading_time, audio_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) notFound();

  // Best-effort — a failed view-count bump must never break the page itself.
  supabaseAdmin.rpc("increment_post_views", { post_id: post.id }).then(() => {});

  return (
    <PostView
      backHref="/journal"
      backLabel="← Journal"
      post={{
        title: post.title,
        body: post.body,
        coverUrl: resolvePostImageUrl(post.cover_image_path),
        clientDisplayName: post.client_display_name,
        publishedAt: post.published_at,
        tag: post.tag,
        readingTime: post.reading_time,
        audioUrl: post.audio_url,
      }}
    />
  );
}
