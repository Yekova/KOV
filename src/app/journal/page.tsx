import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolvePostImageUrl } from "@/lib/portal/storage";
import { JournalListClient } from "@/components/journal/JournalListClient";
import type { JournalPostSummary } from "@/components/journal/journalTypes";

export const metadata: Metadata = {
  title: "Journal — KOV",
  description: "Études de cas et notes de studio — comment on construit ce dont on est fiers.",
  alternates: { canonical: "https://kov-agency.site/journal" },
};

export default async function JournalPage() {
  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select("id, slug, title, excerpt, cover_image_path, client_display_name, published_at, tag, featured, reading_time, views")
    .eq("status", "published")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false });

  const rows: JournalPostSummary[] = (posts ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverUrl: resolvePostImageUrl(p.cover_image_path),
    clientDisplayName: p.client_display_name,
    publishedAt: p.published_at,
    tag: p.tag,
    featured: p.featured,
    readingTime: p.reading_time,
    views: p.views,
  }));

  return <JournalListClient posts={rows} />;
}
