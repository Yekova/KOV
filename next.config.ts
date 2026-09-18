import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The legal pages moved under /legal/* (a real shared hub layout, not
  // just four unrelated top-level routes) — permanent redirects so
  // existing links/bookmarks/search results to the old paths keep working.
  async redirects() {
    return [
      { source: "/cgv", destination: "/legal/cgv", permanent: true },
      { source: "/terms", destination: "/legal/conditions-utilisation", permanent: true },
      { source: "/privacy", destination: "/legal/confidentialite", permanent: true },
      // /expertise and its six service pages were removed — the homepage now
      // carries that content across #expertise, #process and #spotlight.
      // Both were indexed and linked from the sitemap, so they redirect
      // rather than 404. The fragment is for humans with a bookmark; Google
      // only sees the redirect to "/", which is what we want.
      { source: "/expertise", destination: "/#expertise", permanent: true },
      { source: "/expertise/:slug", destination: "/#expertise", permanent: true },
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
