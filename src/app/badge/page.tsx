import type { Metadata } from "next";
import { BadgeReveal } from "@/components/badge/BadgeReveal";

export const metadata: Metadata = {
  title: "Badge KOV",
  description: "Une page qui se trouve, pas qui se cherche.",
  // noindex, and deliberately NOT a Disallow in robots.ts. Disallow says
  // "don't fetch this", which leaves a crawler free to list the bare URL it
  // found elsewhere while forbidden from reading the very instruction that
  // would have kept it out. It is also a public file: adding the path there
  // would print the secret in plain text at /robots.txt.
  //
  // Nothing links here, the route is absent from sitemap.ts, and the page
  // itself says noindex. That is the whole of it.
  robots: { index: false, follow: false },
};

export default function BadgePage() {
  return (
    <main id="kov-main" tabIndex={-1}>
      <BadgeReveal />
    </main>
  );
}
