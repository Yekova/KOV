import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextPressure } from "@/components/layout/TextPressure";
import { robotoFlex } from "@/lib/fonts/robotoFlex";

const NAV_LINKS = [
  { href: "/#work-gallery", label: "Projets" },
  { href: "/expertise", label: "Expertise" },
  { href: "/journal", label: "Journal" },
  { href: "/studio", label: "Studio" },
  { href: "/faq", label: "FAQ" },
];

const LEGAL_LINKS = [
  { href: "/legal", label: "Mentions légales" },
  { href: "/privacy", label: "Confidentialité" },
  { href: "/terms", label: "Conditions d'utilisation" },
];

// KOV has no real social profiles to link yet — a single genuinely
// functional icon (contact) instead of fabricated social links. Add real
// entries here once there's something real to point to.
const CONTACT_ICON_HREF = "/contact";

// Minimal centered layout (logo, tagline, one real icon link, two centered
// link columns, one CTA, copyright) — same content as before, restructured
// around a single vertical axis instead of an asymmetric grid.
export function Footer() {
  return (
    <footer
      className="px-6 pt-32 pb-16 max-w-[1600px] mx-auto border-t text-center"
      style={{ borderColor: "var(--kov-border)" }}
    >
      <div className="pb-10 flex justify-center">
        <Link href="/" aria-label="KOV — Accueil" className="block w-full max-w-[240px] sm:max-w-[320px] md:max-w-[420px]">
          <TextPressure
            text="KOV"
            fontFamily={robotoFlex.style.fontFamily}
            textColor="#E7E7E5"
            minFontSize={56}
            widthRange={[130, 70]}
            weightRange={[650, 400]}
          />
        </Link>
      </div>

      <p className="text-kov-steel text-xs uppercase tracking-widest leading-relaxed">
        Design / Développement / Motion
        <br />
        Bordeaux, France
      </p>

      <div className="mt-8 flex justify-center">
        <Link
          href={CONTACT_ICON_HREF}
          aria-label="Contacter KOV"
          title="Contacter KOV"
          className="w-11 h-11 flex items-center justify-center border text-kov-bone hover:text-kov-red hover:border-kov-red transition-colors"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </Link>
      </div>

      <div
        className="mt-16 pt-10 border-t flex flex-col sm:flex-row justify-center gap-10 sm:gap-20"
        style={{ borderColor: "var(--kov-border)" }}
      >
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
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-4">Légal</p>
          <ul className="space-y-3 list-none">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-kov-bone text-sm hover:text-kov-red transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16">
        <Button href="/contact" variant="primary">
          Démarrer un projet →
        </Button>
      </div>

      <div
        className="mt-16 pt-6 border-t text-[11px] uppercase tracking-widest text-kov-steel"
        style={{ borderColor: "var(--kov-border)" }}
      >
        © {new Date().getFullYear()} KOV. Tous droits réservés.
      </div>
    </footer>
  );
}
