import type { Metadata } from "next";
import { Archivo_Black, Inter, Geist_Mono } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import "./globals.css";

const SITE_URL = "https://kov-agency.site";

// "Monument Extended" (the brief's original ask) is a commercial
// PangramPangram typeface — not on Google Fonts, no license file on hand.
// Archivo Black is the free stand-in: same bold/blocky/geometric impact
// for headings. Single weight (900) is fine here — grepped every
// `font-display` usage sitewide and none pairs it with a weight utility
// class, so there's no lighter cut anywhere relying on being overridden.
const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Le <title> de l'accueil, donc le lien bleu dans Google — et aussi, par
  // héritage, og:title et twitter:title.
  //
  // Deux valeurs ont précédé celle-ci. D'abord la baseline de marque seule
  // ("On construit ce que les gens retiennent.") : belle ligne, mais elle ne
  // disait ni le métier ni le lieu, donc rien à quoi rattacher une recherche.
  // Puis "KOV Studio Design et Développement Web à Bordeaux", qui nommait
  // enfin les deux mais pas le terme commercial : personne ne tape
  // "développement web" pour acheter un site, on tape "création de site web".
  //
  // Celle-ci le nomme, garde la ville et garde la marque, en 55 caractères,
  // sous la limite d'affichage. Le terme d'abord et la marque ensuite, parce
  // que c'est l'ordre utile quand la marque n'est pas encore connue : une
  // recherche sur "KOV" trouve le site de toute façon.
  //
  // "développement" n'est pas perdu : /expertise/developpement est la page
  // dont c'est le sujet, et elle porte ce terme dans son propre titre.
  title: "Création de site web sur mesure à Bordeaux | KOV Studio",
  // 51 caractères, et aucun terme que quelqu'un taperait — Google en
  // affiche jusqu'à ~155 et réécrit lui-même celles qui ne répondent pas à
  // la requête. Celle-ci nomme le métier, la ville et les trois entrées
  // réelles du site : création, refonte, immersif.
  description:
    "Création et refonte de sites internet sur mesure à Bordeaux. Design, développement, motion, et un studio virtuel à visiter.",
  // No `images` here, deliberately, and that absence is the whole point.
  //
  // It used to list the wordmark PNG, which is 1116x209: a 5.34:1 logo strip
  // declared as twitter:card summary_large_image, a format that wants about
  // 1.91:1. Shared to LinkedIn, WhatsApp or Slack, every page but the
  // homepage previewed as a squashed or letterboxed band.
  //
  // Setting it here also silently beat the real card. app/opengraph-image.tsx
  // renders a proper 1200x630, and file-based images ARE inherited by nested
  // segments; a config `images` array on the root layout overrides them for
  // every page that inherits this metadata. Verified by removing it and
  // reading the built HTML: /creation-site-internet, /projets and /faq all
  // resolve /opengraph-image now, where they resolved the PNG before.
  //
  // Articles keep setting their own (their cover), and fall back to this
  // card when they have none, which several currently do.
  openGraph: {
    siteName: "KOV",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${archivoBlack.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <OrganizationJsonLd />
        <CustomCursor />
        <SiteChrome>{children}</SiteChrome>
        <CookieConsent />
      </body>
    </html>
  );
}
