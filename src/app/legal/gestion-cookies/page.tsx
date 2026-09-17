import type { Metadata } from "next";
import { CookieManagementClient } from "./CookieManagementClient";

// This was the one page on the site with no metadata of its own, and the
// reason was structural rather than an oversight: the whole thing was a
// client component (it reads and writes the consent value in localStorage),
// and a client component cannot export `metadata`. So it inherited the root
// layout's title — meaning the homepage and this page shipped the same
// <title> and the same description, which is a duplicate-title pair Search
// Console reports as a defect.
//
// Splitting the interactive part into its own module is the standard fix and
// costs nothing: the server component below owns the metadata, the client one
// owns the behaviour, and the rendered page is unchanged.
export const metadata: Metadata = {
  title: "Gérer mes cookies | KOV",
  description:
    "Consultez et modifiez à tout moment votre choix concernant les cookies de mesure d'audience utilisés sur le site KOV.",
  alternates: { canonical: "https://kov-agency.site/legal/gestion-cookies" },
};

export default function CookieManagementPage() {
  return <CookieManagementClient />;
}
