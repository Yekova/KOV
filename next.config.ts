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
