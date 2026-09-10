"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LEGAL_DOCS } from "@/data/legalDocs";

const ICONS: Record<string, React.ReactNode> = {
  cgv: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M15 3v4h4M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  ),
  mentions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <circle cx="8.5" cy="10.5" r="1.8" />
      <path d="M6 15.5c.6-1.6 1.8-2.4 3-2.4s2.4.8 3 2.4M14.5 9h3.5M14.5 12.5h3.5" strokeLinecap="round" />
    </svg>
  ),
  confidentialite: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  ),
  cookies: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20.5 12.5a8.5 8.5 0 11-9-9c0 1.5 1 3 2.5 3s2-1 3.5-1a3 3 0 003 3c1.5 0 3 1.5 3 4z" />
      <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  "conditions-utilisation": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M9 13.5l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "gestion-cookies": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 7h10M17 7h3M4 12h3M9 12h11M4 17h14M21 17h-1" strokeLinecap="round" />
      <circle cx="14" cy="7" r="2" fill="var(--kov-carbon)" />
      <circle cx="6" cy="12" r="2" fill="var(--kov-carbon)" />
      <circle cx="18" cy="17" r="2" fill="var(--kov-carbon)" />
    </svg>
  ),
};

const CONTACT_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// The hub's real navigation — a sticky category list (LEGAL_DOCS, the
// single shared registry every page's own metadata also draws its number
// from) plus a real Contact link and a small "Une question ?" card, both
// pointing at the site's actual /contact page.
export function LegalSidebar() {
  const pathname = usePathname();

  return (
    <div className="lg:sticky lg:top-32 flex flex-col">
      <nav className="flex flex-col gap-1">
        {LEGAL_DOCS.map((doc) => {
          const active = pathname === doc.href;
          return (
            <Link
              key={doc.slug}
              href={doc.href}
              aria-current={active || undefined}
              className="group flex items-center gap-3 px-4 py-3 transition-colors"
              style={{
                borderLeft: `2px solid ${active ? "var(--kov-red)" : "transparent"}`,
                background: active ? "var(--glass-bg)" : "transparent",
              }}
            >
              <span
                aria-hidden="true"
                className="shrink-0 transition-colors"
                style={{ color: active ? "var(--kov-red)" : "var(--kov-steel)" }}
              >
                {ICONS[doc.slug]}
              </span>
              <span
                className="text-sm transition-colors"
                style={{ color: active ? "var(--kov-bone)" : "var(--kov-steel)" }}
              >
                {doc.label}
              </span>
              {active && (
                <span aria-hidden="true" className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--kov-red)" }} />
              )}
            </Link>
          );
        })}

        <Link
          href="/contact"
          className="flex items-center gap-3 px-4 py-3 mt-2 pt-5 text-kov-steel hover:text-kov-bone transition-colors"
          style={{ borderTop: "1px solid var(--glass-border)" }}
        >
          <span aria-hidden="true" className="shrink-0">
            {CONTACT_ICON}
          </span>
          <span className="text-sm">Contact</span>
        </Link>
      </nav>

      <div className="relative mt-6 overflow-hidden p-6" style={{ borderRadius: 20, border: "1px solid var(--glass-border)" }}>
        <Image src="/legal/contact-glow.webp" alt="" fill className="object-cover" style={{ opacity: 0.55 }} />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, rgba(5,5,5,0.35), rgba(5,5,5,0.9))" }}
        />
        <div className="relative">
          <p className="font-display text-kov-bone uppercase text-lg">Une question ?</p>
          <p className="mt-3 text-kov-steel text-xs leading-relaxed">
            Notre équipe est à votre disposition pour toute demande relative à nos documents légaux.
          </p>
          <div className="mt-5">
            <Button href="/contact" variant="secondary">
              Nous contacter →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
