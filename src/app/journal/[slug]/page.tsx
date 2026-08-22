import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { PostView } from "@/components/journal/PostView";

export async function generateMetadata(props: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) return { title: "Journal — KOV" };
  return { title: `${post.title} — KOV`, description: post.excerpt ?? undefined };
}

export default async function JournalPostPage(props: PageProps<"/journal/[slug]">) {
  const { slug } = await props.params;

  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("title, body, cover_image_path, client_display_name, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) notFound();

  return (
    <PostView
      backHref="/journal"
      backLabel="← Journal"
      post={{
        title: post.title,
        body: post.body,
        coverUrl: getPublicAssetUrl(post.cover_image_path),
        clientDisplayName: post.client_display_name,
        publishedAt: post.published_at,
      }}
    />
  );
}
