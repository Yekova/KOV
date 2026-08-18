import Link from "next/link";

const LINKS = [
  { href: "/#work", label: "Work" },
  { href: "/expertise", label: "Expertise" },
  { href: "/studio", label: "Studio" },
  { href: "/contact", label: "Contact" },
];

export function HomeFooter() {
  return (
    <footer className="px-6 pt-32 pb-16 max-w-[1600px] mx-auto">
      <div className="border-t pt-20 flex flex-col items-start" style={{ borderColor: "var(--kov-border)" }}>
        <h2
          className="font-display text-kov-bone uppercase max-w-2xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Have a project?
          <br />
          <span className="text-kov-red">Let&apos;s build it.</span>
        </h2>

        <Link
          href="/contact"
          className="mt-10 inline-block text-xs uppercase tracking-widest text-kov-bone border px-6 py-4 hover:text-kov-red hover:border-kov-red transition-colors"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          Start a project →
        </Link>
      </div>

      <div
        className="mt-24 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-8 border-t text-xs uppercase tracking-widest text-kov-steel"
        style={{ borderColor: "var(--kov-border)" }}
      >
        <span className="font-display text-kov-bone">KOV</span>
        <div className="flex flex-wrap gap-8">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-kov-red transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <span>Bordeaux, France</span>
      </div>
    </footer>
  );
}
