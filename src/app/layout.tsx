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
  // L'ancienne valeur était la baseline de marque seule ("On construit ce que
  // les gens retiennent."). Belle ligne, mais elle ne disait nulle part ce que
  // fait KOV ni où : rien à quoi rattacher une recherche, et c'est exactement
  // le cas où Google réécrit le titre lui-même. Celui-ci nomme le métier et la
  // ville, en 49 caractères — sous la limite d'affichage.
  //
  // La baseline n'a pas disparu pour autant : elle reste le <h1> de la page
  // (HeroScene) et la ligne de la carte sociale.
  title: "KOV Studio Design et Développement Web à Bordeaux",
  description: "KOV transforme les idées en expériences numériques.",
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
