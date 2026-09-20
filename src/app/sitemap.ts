import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SITE_URL = "https://kov-agency.site";

// The sitemap was a pure build-time prerender, like /journal and the homepage
// hero were before them: an article published through the admin did not appear
// in it until the next deploy. An hour's revalidation plus the admin's own
// revalidatePath("/sitemap.xml") closes both cases — the instant one and the
// "someone published straight into Supabase" one.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/projets`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/journal`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/studio`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
  ];

  // Six real, indexable pages, linked from the footer of every page on the
  // site, that the sitemap did not mention. Low priority because that is what
  // they are — but a legal hub is exactly the kind of thing people search for
  // by name, and leaving them out of the sitemap while linking to them
  // everywhere was an inconsistency, not a decision.
  const legalRoutes: MetadataRoute.Sitemap = [
    "/legal",
    "/legal/cgv",
    "/legal/conditions-utilisation",
    "/legal/confidentialite",
    "/legal/cookies",
    "/legal/gestion-cookies",
  ].map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: "yearly" as const, priority: 0.3 }));

  // /login, /merci and /journal/preview are deliberately absent: all three
  // answer noindex. A sitemap is a list of pages you want indexed, so listing
  // a noindex page is a contradiction Search Console reports back at you.
  const { data: posts, error } = await supabaseAdmin
    .from("posts")
    .select("slug, updated_at")
    .eq("status", "published");

  // Reading only `data` made a failed query indistinguishable from "no
  // articles published", and the result was a sitemap silently shipped
  // without a single article in it — the same swallowed-error shape that
  // emptied /journal. It still degrades rather than failing the build; it
  // just says so now.
  if (error) {
    console.error("[sitemap] posts query failed, article URLs omitted:", error.message);
  }

  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${SITE_URL}/journal/${post.slug}`,
    // A real modification date, from the row itself. Deliberately not set on
    // the static routes above: stamping every one of them with the build date
    // would tell Google the whole site changed on every deploy, and a lastmod
    // that is never accurate is one Google learns to ignore.
    lastModified: post.updated_at,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...legalRoutes, ...postRoutes];
}
