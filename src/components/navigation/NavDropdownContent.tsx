import Link from "next/link";
import { PILLARS } from "@/data/expertisePillars";
import { PRINCIPLES } from "@/data/studioPrinciples";

const FOOTER_LINK_CLASS =
  "text-xs uppercase tracking-widest text-kov-bone hover:text-kov-red transition-colors";

// Content for the two nav dropdowns that have real sub-content to show
// (Projets and Journal don't — see Nav.tsx). Slugs point at real ids added
// to the pillar/principle blocks on their respective pages. Deliberately
// title-only, no body copy — a hover menu is skimmed, not read; the full
// sentence per item still lives one click away on the real page.
export function ExpertiseDropdown({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="p-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
        {PILLARS.map((pillar) => (
          <Link
            key={pillar.slug}
            href={`/expertise#${pillar.slug}`}
            onClick={onNavigate}
            className="group flex items-baseline gap-2 py-2"
          >
            <span className="text-kov-red font-mono text-[10px] shrink-0">{pillar.number}</span>
            <span className="text-kov-bone text-sm uppercase tracking-wide group-hover:text-kov-red transition-colors">
              {pillar.title}
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t flex justify-end" style={{ borderColor: "var(--glass-border)" }}>
        <Link href="/expertise" onClick={onNavigate} className={FOOTER_LINK_CLASS}>
          Toute l&apos;expertise →
        </Link>
      </div>
    </div>
  );
}

export function StudioDropdown({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="p-5">
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        {PRINCIPLES.map((principle) => (
          <Link
            key={principle.slug}
            href={`/studio#${principle.slug}`}
            onClick={onNavigate}
            className="text-kov-bone text-sm uppercase tracking-wide hover:text-kov-red transition-colors py-1"
          >
            {principle.word}
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t flex justify-end" style={{ borderColor: "var(--glass-border)" }}>
        <Link href="/studio" onClick={onNavigate} className={FOOTER_LINK_CLASS}>
          Découvrir le studio →
        </Link>
      </div>
    </div>
  );
}
