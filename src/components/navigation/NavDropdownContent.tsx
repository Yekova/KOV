import Link from "next/link";
import { PILLARS } from "@/data/expertisePillars";
import { PRINCIPLES } from "@/data/studioPrinciples";

const FOOTER_LINK_CLASS =
  "text-xs uppercase tracking-widest text-kov-bone hover:text-kov-red transition-colors";

// Content for the two nav dropdowns that have real sub-content to show
// (Projets and Journal don't — see Nav.tsx). Slugs point at real ids added
// to the pillar/principle blocks on their respective pages.
export function ExpertiseDropdown({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
        {PILLARS.map((pillar) => (
          <Link key={pillar.slug} href={`/expertise#${pillar.slug}`} onClick={onNavigate} className="group block">
            <p className="text-kov-red font-mono text-[11px] mb-1.5">{pillar.number}</p>
            <p className="text-kov-bone text-sm uppercase tracking-wide mb-1 group-hover:text-kov-red transition-colors">
              {pillar.title}
            </p>
            <p className="text-kov-steel text-xs leading-relaxed">{pillar.body}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 pt-5 border-t flex justify-end" style={{ borderColor: "var(--glass-border)" }}>
        <Link href="/expertise" onClick={onNavigate} className={FOOTER_LINK_CLASS}>
          Toute l&apos;expertise →
        </Link>
      </div>
    </div>
  );
}

export function StudioDropdown({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        {PRINCIPLES.map((principle) => (
          <Link key={principle.slug} href={`/studio#${principle.slug}`} onClick={onNavigate} className="group block">
            <p className="text-kov-bone text-sm uppercase tracking-wide mb-1 group-hover:text-kov-red transition-colors">
              {principle.word}
            </p>
            <p className="text-kov-steel text-xs leading-relaxed">{principle.body}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 pt-5 border-t flex justify-end" style={{ borderColor: "var(--glass-border)" }}>
        <Link href="/studio" onClick={onNavigate} className={FOOTER_LINK_CLASS}>
          Découvrir le studio →
        </Link>
      </div>
    </div>
  );
}
