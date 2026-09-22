import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The legal pages moved under /legal/* (a real shared hub layout, not
  // just four unrelated top-level routes) — permanent redirects so
  // existing links/bookmarks/search results to the old paths keep working.
  async redirects() {
    return [
      // One site, one hostname.
      //
      // www.kov-agency.site was serving the whole site directly, with no
      // redirect: two hostnames, identical content, and a sitemap on the www
      // one listing nothing but apex URLs. The canonical tags already pointed
      // at the apex, so this is the redirect that was missing rather than a
      // change of mind about which host is real.
      //
      // It also removes a way to fail in Search Console: a sitemap has to
      // live inside the property it is submitted to, and two reachable
      // hostnames is two properties to get that wrong between.
      //
      // Safe against a loop: the apex answers 200 directly today, so nothing
      // upstream is sending it the other way.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.kov-agency.site" }],
        destination: "https://kov-agency.site/:path*",
        permanent: true,
      },
      { source: "/cgv", destination: "/legal/cgv", permanent: true },
      { source: "/terms", destination: "/legal/conditions-utilisation", permanent: true },
      { source: "/privacy", destination: "/legal/confidentialite", permanent: true },
      // /expertise and its six pages redirected to an anchor on the homepage
      // for a while. That is defensible for a small site and wrong for
      // search: an anchor cannot rank, cannot carry a title, and cannot
      // answer a question — and commercial intent is a question. The pages
      // are back, so the redirects are gone; anything still linking to the
      // old URLs now lands on the real page rather than being bounced.
    ];
  },
  experimental: {
    serverActions: {
      // Default is 1MB — too small for document/invoice PDF uploads in the
      // client portal admin tooling.
      bodySizeLimit: "10mb",
    },
  },
  images: {
    // Default is WebP alone. AVIF is ~20% smaller again, and this site is
    // image-heavy (brand plates, studio panoramas, journal covers), so it is
    // worth the slower first encode — Vercel caches each format afterwards.
    // Order matters: the first entry the browser's Accept header matches wins,
    // and anything too old for AVIF still falls through to WebP.
    formats: ["image/avif", "image/webp"],
    // minimumCacheTTL deliberately left at its 4h default: journal covers are
    // uploaded with upsert:true to a deterministic storage path, so replacing
    // an article's cover reuses its URL. A long TTL here would serve the old
    // picture for as long as it lasted.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "igrxixwyiqmyxnjuvuzy.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
