import type { MetadataRoute } from "next";

const SITE_URL = "https://kov-agency.site";

// Disallow and noindex answer two different questions, and only one of them
// keeps a page out of the index.
//
// Disallow says "don't fetch this". A URL that is disallowed but linked from
// somewhere can still end up in results — as a bare URL with no title and no
// snippet — precisely because the crawler was forbidden from fetching the
// page that would have told it noindex. /login is linked from the footer of
// every page on the site, so it was the textbook case for that: it now
// carries `robots: { index: false }` in its own metadata and is crawlable, so
// the instruction actually gets read.
//
// /admin and /client stay disallowed because there is genuinely nothing to
// fetch: both redirect to /login for anyone without a session (src/proxy.ts),
// so there is no page for a noindex to live on. The two preview routes are
// the same shape — requireAdmin() guards both — and each carries its own
// noindex too, for the case where a draft URL gets shared.
//
// None of this is a security boundary. The real boundary is the auth check in
// src/proxy.ts and requireAdmin(); robots.txt is a public file that says out
// loud what it lists.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/client", "/journal/preview", "/projets/preview", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
