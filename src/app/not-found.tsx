import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

// A 404 is a page like any other, and this site did not have one — Next's
// bare default was being served instead: black-on-white Helvetica, the KOV
// identity nowhere, and no way back into the site except the browser's back
// button. Google already got the right status code (Next returns a real 404
// here, which is what matters for indexation); what was missing was everything
// the visitor needed.
//
// Kept deliberately close to /merci: same centred single-column shell, same
// display heading with a red full stop, same CTA pair. A 404 should read as
// part of the site, not as an error screen from somewhere else.
export const metadata: Metadata = {
  title: "Page introuvable | KOV",
  // A 404 must never be indexed. Next already answers 404 so a crawler drops
  // it anyway; this states it outright, and follow:true keeps the links below
  // crawlable so the crawler is routed back into the real site rather than
  // hitting a dead end.
  robots: { index: false, follow: true },
};

const SUGGESTIONS = [
  { href: "/#expertise", label: "Expertise", hint: "Ce qu'on construit" },
  { href: "/studio", label: "Studio", hint: "La visite en 360°" },
  { href: "/journal", label: "Journal", hint: "Ce qu'on publie" },
  { href: "/faq", label: "FAQ", hint: "Les questions fréquentes" },
];

export default function NotFound() {
  return (
    <main id="kov-main" tabIndex={-1} className="min-h-screen flex items-center justify-center px-6 py-32">
      <div className="max-w-xl w-full text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-kov-red mb-6">Erreur 404</p>
        <h1
          className="font-display text-kov-bone uppercase"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Page introuvable<span className="text-kov-red">.</span>
        </h1>
        <p className="mt-6 text-kov-concrete text-sm leading-relaxed">
          Cette adresse ne mène nulle part — elle a peut-être changé, ou n&apos;a jamais existé. Voici par où
          reprendre.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button href="/" variant="primary">
            Retour à l&apos;accueil
          </Button>
          <Button href="/contact" variant="secondary">
            Nous écrire
          </Button>
        </div>

        {/* Real routes back into the site, not decoration: a 404 that offers
            somewhere to go is also a 404 that passes a crawler onwards
            instead of stopping it. */}
        <div
          className="mt-14 pt-8 border-t grid grid-cols-2 gap-x-6 gap-y-4 text-left"
          style={{ borderColor: "var(--kov-border)" }}
        >
          {SUGGESTIONS.map((item) => (
            <Link key={item.href} href={item.href} className="group block">
              <span className="block text-kov-bone text-sm group-hover:text-kov-red transition-colors">
                {item.label}
              </span>
              <span className="block text-kov-steel text-[11px] uppercase tracking-widest mt-0.5">{item.hint}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
