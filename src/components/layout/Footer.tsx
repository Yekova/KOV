import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { PILLARS } from "@/data/expertisePillars";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/expertise", label: "Expertise" },
  { href: "/studio", label: "Studio" },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

const RESOURCE_LINKS = [
  { href: "/journal", label: "Journal" },
  { href: "/faq", label: "FAQ" },
];

const CLIENT_LINKS = [{ href: "/login", label: "Connexion" }];

const LEGAL_LINKS = [
  { href: "/legal", label: "Mentions légales" },
  { href: "/privacy", label: "Confidentialité" },
  { href: "/terms", label: "Conditions d'utilisation" },
  { href: "/cgv", label: "CGV" },
];

// KOV has no real social profiles yet — these are the recognizable icons for
// the standard platforms, all pointing at /contact for now as a placeholder
// rather than a dead "#" link. Swap each href for the real profile URL as
// soon as one exists.
const SOCIAL_LINKS = [
  {
    name: "LinkedIn",
    href: "/contact",
    icon: (
      <path d="M4.98 3.5C4.98 4.88 3.9 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4v13h-4V8zM8.5 8h3.83v1.78h.05c.53-1 1.85-2.05 3.8-2.05 4.07 0 4.82 2.68 4.82 6.16V21h-4v-6.3c0-1.5-.03-3.44-2.1-3.44-2.1 0-2.42 1.64-2.42 3.33V21h-4V8z" />
    ),
  },
  {
    name: "Instagram",
    href: "/contact",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.4" cy="6.6" r="1.1" />
      </>
    ),
  },
  {
    name: "X",
    href: "/contact",
    icon: (
      <path d="M13.6 10.4 20.4 2.5h-1.7l-5.9 6.9-4.8-6.9H2l7.2 10.3L2 21.5h1.7l6.3-7.3 5 7.3H21zm-2.2 2.6-.7-1-5.8-8.3H7.3l4.7 6.7.7 1 6.1 8.7h-2.5z" />
    ),
  },
];

// Stronger than the sitewide --glass-blur (20px, tuned for ordinary glass
// panels sitting over largely static backgrounds) — the footer needs to
// fully soften a busy, moving pattern behind it for its text to stay
// legible, not just tint it.
const FOOTER_BLUR_PX = 40;

// The blur layer's box starts this far *above* the footer's own top edge —
// so the fade is already partway through by the time the footer's own
// border line arrives, rather than starting from scratch exactly at that
// line. Extends this far *past* the bottom too, as a deliberate overshoot:
// inset-y-0 alone would exactly match the footer's own box, and depending
// on how that height gets measured relative to this absolutely-positioned
// child, a mismatch could leave a thin unblurred strip right at the
// bottom edge — the overshoot makes that impossible regardless.
const FOOTER_BLUR_OVERSHOOT_PX = 260;

// Length of the fade in pixels, measured from the (raised) top of the blur
// box — reaches full strength roughly FOOTER_BLUR_FADE_PX -
// FOOTER_BLUR_OVERSHOOT_PX into the footer's own actual content. Pixel-
// based rather than a percentage of the box's own height, so the fade
// length stays consistent regardless of how tall the footer's content is.
const FOOTER_BLUR_FADE_PX = 420;

export function Footer() {
  return (
    // relative + a full-bleed blur layer as a child (not the <footer>'s own
    // background) — <footer> itself is max-w-[1600px] mx-auto for its real
    // content, but the blur needs to cover the *entire* viewport width, not
    // just that centered column, or the animated background (LineWaves,
    // see src/app/page.tsx) would show through sharp in the side margins on
    // wide screens. The `left: 50%; width: 100vw; translateX(-50%)` trick
    // breaks the blur layer out of the max-width constraint without
    // touching layout of the actual footer content. It's masked with a
    // top-to-bottom gradient so the blur eases in gradually from the
    // footer's own top edge instead of cutting on abruptly, and given a
    // negative z-index so it paints behind the footer's own (non-
    // positioned) content without needing to elevate that content.
    // Harmless on every other page: nothing colorful sits behind a plain
    // black background to blur.
    <footer className="relative px-6 pt-24 pb-10 max-w-[1600px] mx-auto border-t" style={{ borderColor: "var(--kov-border)" }}>
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          left: "50%",
          width: "100vw",
          top: -FOOTER_BLUR_OVERSHOOT_PX,
          bottom: -FOOTER_BLUR_OVERSHOOT_PX,
          transform: "translateX(-50%)",
          zIndex: -1,
          background: "var(--glass-bg)",
          backdropFilter: `blur(${FOOTER_BLUR_PX}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${FOOTER_BLUR_PX}px) saturate(180%)`,
          maskImage: `linear-gradient(to bottom, transparent 0px, black ${FOOTER_BLUR_FADE_PX}px)`,
          WebkitMaskImage: `linear-gradient(to bottom, transparent 0px, black ${FOOTER_BLUR_FADE_PX}px)`,
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link href="/" aria-label="KOV — Accueil" className="block">
            <Image src="/kov/brand/kov-wordmark-bone.png" alt="KOV" width={1116} height={209} className="h-9 w-auto" />
          </Link>
          <p className="mt-4 max-w-xs text-kov-concrete text-sm leading-relaxed">
            Studio digital spécialisé en stratégie, design, développement et systèmes interactifs.
          </p>
          <Link href="/studio" className="mt-3 inline-flex items-center gap-1 text-kov-red text-xs uppercase tracking-widest hover:text-kov-red-signal transition-colors">
            Voir le studio →
          </Link>
        </div>

        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-4">Navigation</p>
          <ul className="space-y-3 list-none">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-kov-bone text-sm hover:text-kov-red transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-4">Expertise</p>
          <ul className="space-y-3 list-none">
            {PILLARS.map((pillar) => (
              <li key={pillar.slug}>
                <Link href={`/expertise#${pillar.slug}`} className="text-kov-bone text-sm hover:text-kov-red transition-colors">
                  {pillar.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-4">Ressources</p>
          <ul className="space-y-3 list-none">
            {RESOURCE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-kov-bone text-sm hover:text-kov-red transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="text-kov-steel text-xs uppercase tracking-widest mb-4 mt-8">Espace client</p>
          <ul className="space-y-3 list-none">
            {CLIENT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-kov-bone text-sm hover:text-kov-red transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-4">Nous contacter</p>
          <ul className="space-y-3 list-none text-sm text-kov-bone">
            <li>Bordeaux, France</li>
            <li>
              <Link href="/contact" className="hover:text-kov-red transition-colors">
                Démarrer un projet →
              </Link>
            </li>
          </ul>

          <p className="text-kov-steel text-xs uppercase tracking-widest mb-3 mt-8">Suivez-nous</p>
          <div className="flex gap-2">
            {SOCIAL_LINKS.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                aria-label={social.name}
                title={social.name}
                className="w-10 h-10 flex items-center justify-center border text-kov-bone hover:text-kov-red hover:border-kov-red transition-colors"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  {social.icon}
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <Button href="/contact" variant="primary">
          Démarrer un projet →
        </Button>
      </div>

      <div
        className="mt-16 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] uppercase tracking-widest text-kov-steel"
        style={{ borderColor: "var(--kov-border)" }}
      >
        <span>© {new Date().getFullYear()} KOV. Tous droits réservés.</span>
        <div className="flex flex-wrap justify-center gap-6">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-kov-red transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
