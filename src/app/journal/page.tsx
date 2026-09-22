import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolvePostImageUrl } from "@/lib/portal/storage";
import { JournalListClient } from "@/components/journal/JournalListClient";
import type { JournalPostSummary } from "@/components/journal/journalTypes";

export const metadata: Metadata = {
  title: "Journal — études de cas et notes de studio | KOV",
  description:
    "Études de cas et notes de studio : comment on construit un site, ce qu'on décide en chemin et pourquoi. Le raisonnement derrière le travail, pas un blog.",
  alternates: { canonical: "https://kov-agency.site/journal" },
};

// This page's content lives in a database, so it must not be baked once at
// build time — which is exactly what went wrong: the build-time query came
// back with nothing, the empty result was frozen into a static page, and a
// post published on 1 September was still invisible sixteen days later while
// /journal/[slug] served it perfectly, because that route renders per
// request. A revalidation window means the listing now repairs itself within
// a minute no matter how a post was published — through the admin (which
// also calls revalidatePath for an instant update), or straight into
// Supabase, which nothing in the app can know about.
export const revalidate = 60;

export default async function JournalPage() {
  const { data: posts, error } = await supabaseAdmin
    .from("posts")
    .select("id, slug, title, excerpt, cover_image_path, client_display_name, published_at, tag, featured, reading_time, views")
    .eq("status", "published")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false });

  // The error used to be dropped on the floor, and that is the reason this
  // was invisible: a failed query and a genuinely empty journal both came
  // out as "Rien à lire pour l'instant". They are not the same thing, and
  // the difference now reaches the logs.
  if (error) {
    console.error("[journal] posts query failed, rendering an empty list:", error.message);
  }

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
