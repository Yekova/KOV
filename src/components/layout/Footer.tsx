import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { TextPressure } from "@/components/layout/TextPressure";
import { FooterGlobe } from "@/components/layout/FooterGlobe";
import { robotoFlex } from "@/lib/fonts/robotoFlex";
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
];

// KOV has no real social profiles to link yet — a single genuinely
// functional icon (contact) instead of fabricated social links.
const CONTACT_ICON_HREF = "/contact";

export function Footer() {
  return (
    <footer className="px-6 pt-24 pb-10 max-w-[1600px] mx-auto border-t" style={{ borderColor: "var(--kov-border)" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link href="/" aria-label="KOV — Accueil" className="block w-full max-w-[280px]">
            <TextPressure
              text="KOV"
              fontFamily={robotoFlex.style.fontFamily}
              textColor="#E7E7E5"
              minFontSize={48}
              widthRange={[130, 70]}
              weightRange={[650, 400]}
            />
          </Link>
          <p className="mt-4 max-w-xs text-kov-concrete text-sm leading-relaxed">
            Studio digital spécialisé en stratégie, design, développement et systèmes interactifs.
          </p>
          <Link href="/studio" className="mt-3 inline-flex items-center gap-1 text-kov-red text-xs uppercase tracking-widest hover:text-kov-red-signal transition-colors">
            Voir le studio →
          </Link>

          <div className="mt-8 relative w-full max-w-[280px] aspect-[4/3] overflow-hidden" style={{ borderRadius: "var(--radius-md)" }}>
            <Image
              src="/kov/character/contact-frames/frame-040.jpg"
              alt=""
              aria-hidden="true"
              fill
              sizes="280px"
              className="object-cover"
            />
          </div>
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
          <Link
            href={CONTACT_ICON_HREF}
            aria-label="Contacter KOV"
            title="Contacter KOV"
            className="w-10 h-10 flex items-center justify-center border text-kov-bone hover:text-kov-red hover:border-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="mt-16 pt-10 border-t grid grid-cols-1 md:grid-cols-2 gap-10 items-center" style={{ borderColor: "var(--kov-border)" }}>
        <div className="flex items-center gap-5">
          <Image
            src="/kov/character/assistant-portrait-transparent.png"
            alt=""
            aria-hidden="true"
            width={621}
            height={1007}
            className="w-20 h-auto shrink-0"
          />
          <div>
            <p className="font-display text-kov-bone uppercase text-lg">Besoin d&apos;aide ?</p>
            <p className="text-kov-steel text-sm mt-1">Notre équipe est là pour vous accompagner.</p>
            <Link href="/contact" className="mt-2 inline-flex items-center gap-1 text-kov-red text-xs uppercase tracking-widest hover:text-kov-red-signal transition-colors">
              Contacter KOV →
            </Link>
          </div>
        </div>

        <div className="hidden md:flex justify-end">
          <div className="w-32 h-32">
            <FooterGlobe />
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
