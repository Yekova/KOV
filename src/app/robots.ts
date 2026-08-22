import type { MetadataRoute } from "next";

const SITE_URL = "https://kov-agency.site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/client", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
