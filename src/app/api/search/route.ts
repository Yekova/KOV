import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { SearchItem } from "@/data/searchIndex";

// The articles, for the site's own search box.
//
// They are not in src/data/searchIndex.ts on purpose: posts are written and
// published from /admin without a deploy, so a list baked into the client
// bundle would be wrong the moment the owner published anything. That is
// the exact failure this whole change is repairing, and repeating it one
// file over would be a poor joke.
//
// Five minutes of revalidation: a new article showing up in the search box
// a few minutes after publication is fine, and it means the search does not
// put a database query behind every keystroke. Keystrokes never reach here
// anyway — searchKov fetches this once per page load and filters in memory.
//
// robots.txt disallows /api/, which is correct: this is a convenience for
// visitors, not a surface for crawlers. The journal's own pages and the
// sitemap are how articles get found by machines.
export const revalidate = 300;

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("slug, title, excerpt, tag")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  // Degrade to the static index rather than failing the search box. Read
  // `error` explicitly: the same swallowed-error shape emptied /journal once
  // and shipped a sitemap with no articles in it.
  if (error) {
    console.error("[api/search] posts query failed, articles omitted:", error.message);
    return NextResponse.json([] satisfies SearchItem[]);
  }

  const items: SearchItem[] = (data ?? []).map((post) => ({
    title: post.title,
    category: "Journal",
    href: `/journal/${post.slug}`,
    description: post.excerpt ?? "",
    keywords: post.tag ? [post.tag] : undefined,
  }));

  return NextResponse.json(items);
}
