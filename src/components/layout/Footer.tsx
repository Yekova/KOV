import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextPressure } from "@/components/layout/TextPressure";
import { robotoFlex } from "@/lib/fonts/robotoFlex";

const NAV_LINKS = [
  { href: "/#work-gallery", label: "Projets" },
  { href: "/expertise", label: "Expertise" },
  { href: "/studio", label: "Studio" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/legal", label: "Mentions légales" },
  { href: "/privacy", label: "Confidentialité" },
  { href: "/terms", label: "Conditions d'utilisation" },
];

export function Footer() {
  return (
    <footer className="px-6 pt-32 pb-10 max-w-[1600px] mx-auto border-t" style={{ borderColor: "var(--kov-border)" }}>
      <div className="pt-16 pb-16 flex justify-center">
        <Link href="/" aria-label="KOV — Accueil" className="block w-full max-w-[240px] sm:max-w-[320px] md:max-w-[420px]">
          <TextPressure
            text="KOV"
            fontFamily={robotoFlex.style.fontFamily}
            textColor="#E7E7E5"
            minFontSize={56}
          />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pt-10 border-t" style={{ borderColor: "var(--kov-border)" }}>
        <div className="col-span-2 md:col-span-1">
          <p className="text-kov-steel text-xs uppercase tracking-widest leading-relaxed">
            Design / Développement / Motion
            <br />
            Bordeaux, France
          </p>
        </div>

        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-4">Navigation</p>
          <ul className="space-y-3">
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
          <ul className="space-y-3">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-kov-bone text-sm hover:text-kov-red transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-4">Contact</p>
          <Button href="/contact" variant="secondary">
            Démarrer un projet →
          </Button>
        </div>
      </div>

      <div
        className="mt-20 pt-6 border-t text-[11px] uppercase tracking-widest text-kov-steel"
        style={{ borderColor: "var(--kov-border)" }}
      >
        © {new Date().getFullYear()} KOV. Tous droits réservés.
      </div>
    </footer>
  );
}
