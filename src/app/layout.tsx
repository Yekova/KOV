import type { Metadata } from "next";
import { Archivo_Black, Inter, Geist_Mono } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { AosInit } from "@/components/ui/AosInit";
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
  title: "KOV — On construit ce que les gens retiennent.",
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
        <AosInit />
        <SiteChrome>{children}</SiteChrome>
        <CookieConsent />
      </body>
    </html>
  );
}
