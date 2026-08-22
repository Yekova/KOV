import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SITE_URL = "https://kov-agency.site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/expertise`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/studio`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/journal`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const { data: posts } = await supabaseAdmin.from("posts").select("slug, updated_at").eq("status", "published");

  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${SITE_URL}/journal/${post.slug}`,
    lastModified: post.updated_at,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes];
}
