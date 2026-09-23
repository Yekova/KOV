import type { Metadata } from "next";
import { Archivo_Black, Inter, Geist_Mono } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { CustomCursor } from "@/components/ui/CustomCursor";
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
    "Studio digital à Bordeaux. Création et refonte de sites internet, design sur mesure et expériences immersives en 3D — avec un studio virtuel à visiter.",
  openGraph: {
    siteName: "KOV",
    locale: "fr_FR",
    type: "website",
    images: ["/kov/brand/kov-wordmark-bone.png"],
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
        {/* CookieConsent temporarily disabled — a live report of the
            banner not responding to clicks at all (not even hover) needs
            more diagnosis than could be done without a real browser
            (see CookieConsent.tsx's own hardening from this same session,
            which is still in place and unaffected). Re-enable by restoring
            this line and its import once that's resolved. */}
      </body>
    </html>
  );
}
