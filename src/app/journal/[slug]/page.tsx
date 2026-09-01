import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolvePostImageUrl } from "@/lib/portal/storage";
import { ArticleDetail } from "@/components/journal/ArticleDetail";
import type { JournalPostSummary } from "@/components/journal/journalTypes";

const SITE_URL = "https://kov-agency.site";

export async function generateMetadata(props: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("title, excerpt, meta_title, meta_description, cover_image_path")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) return { title: "Journal — KOV" };

  const title = post.meta_title || `${post.title} — KOV`;
  const description = post.meta_description || post.excerpt || undefined;
  const image = resolvePostImageUrl(post.cover_image_path);

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/journal/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/journal/${slug}`,
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function JournalPostPage(props: PageProps<"/journal/[slug]">) {
  const { slug } = await props.params;

  const { data: post } = await supabaseAdmin
    .from("posts")
    .select(
      "id, slug, title, excerpt, body, cover_image_path, client_display_name, published_at, tag, reading_time, author_name, audio_url, views, likes, related_post_ids"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) notFound();

  const RELATED_COLUMNS = "id, slug, title, excerpt, cover_image_path, client_display_name, published_at, tag, featured, reading_time, views";
  const relatedIds: string[] = post.related_post_ids ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let relatedRows: any[] = [];

  if (relatedIds.length > 0) {
    const { data } = await supabaseAdmin.from("posts").select(RELATED_COLUMNS).in("id", relatedIds).eq("status", "published");
    relatedRows = (data ?? []).filter((r) => r.id !== post.id).sort((a, b) => relatedIds.indexOf(a.id) - relatedIds.indexOf(b.id));
  }

  if (relatedRows.length === 0) {
    const { data } = await supabaseAdmin
      .from("posts")
      .select(RELATED_COLUMNS)
      .eq("status", "published")
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3);
    relatedRows = data ?? [];
  } else {
    relatedRows = relatedRows.slice(0, 3);
  }

  const related: JournalPostSummary[] = relatedRows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    coverUrl: resolvePostImageUrl(r.cover_image_path),
    clientDisplayName: r.client_display_name,
    publishedAt: r.published_at,
    tag: r.tag,
    featured: r.featured,
    readingTime: r.reading_time,
    views: r.views,
  }));

  const articleUrl = `${SITE_URL}/journal/${post.slug}`;
  const coverUrl = resolvePostImageUrl(post.cover_image_path);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt ?? undefined,
        image: coverUrl ?? undefined,
        datePublished: post.published_at ?? undefined,
        author: { "@type": "Organization", name: post.author_name || "KOV" },
        mainEntityOfPage: articleUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Journal", item: `${SITE_URL}/journal` },
          { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleDetail
        article={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          body: post.body,
          coverUrl,
          clientDisplayName: post.client_display_name,
          publishedAt: post.published_at,
          tag: post.tag,
          readingTime: post.reading_time,
          authorName: post.author_name,
          audioUrl: post.audio_url,
          views: post.views,
          likes: post.likes,
        }}
        related={related}
      />
    </>
  );
}
