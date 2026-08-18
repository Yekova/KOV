import Link from "next/link";

const NAV_LINKS = [
  { href: "/#work", label: "Work" },
  { href: "/expertise", label: "Expertise" },
  { href: "/studio", label: "Studio" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/legal", label: "Legal notice" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of use" },
];

export function Footer() {
  return (
    <footer className="px-6 pt-24 pb-10 max-w-[1600px] mx-auto border-t" style={{ borderColor: "var(--kov-border)" }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pt-16">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-kov-bone text-lg mb-3">KOV</p>
          <p className="text-kov-steel text-xs uppercase tracking-widest leading-relaxed">
            Design / Development / Motion
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
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-4">Legal</p>
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
          <Link href="/contact" className="text-kov-bone text-sm hover:text-kov-red transition-colors">
            Start a project →
          </Link>
        </div>
      </div>

      <div
        className="mt-20 pt-6 border-t text-[11px] uppercase tracking-widest text-kov-steel"
        style={{ borderColor: "var(--kov-border)" }}
      >
        © {new Date().getFullYear()} KOV. All rights reserved.
      </div>
    </footer>
  );
}
