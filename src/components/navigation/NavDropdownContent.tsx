import Link from "next/link";
import { PRINCIPLES } from "@/data/studioPrinciples";

const FOOTER_LINK_CLASS =
  "text-xs uppercase tracking-widest text-kov-bone hover:text-kov-red transition-colors";

// Content for the nav dropdown that has real sub-content to show. The
// Expertise dropdown went with the /expertise page it previewed — the nav
// entry now points straight at the homepage's own #expertise section, and a
// menu whose six items all resolve to one anchor is not a menu. Slugs point at real ids added
// to the pillar/principle blocks on their respective pages. Deliberately
// title-only, no body copy — a hover menu is skimmed, not read; the full
// sentence per item still lives one click away on the real page.
export function StudioDropdown({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="p-5">
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        {PRINCIPLES.map((principle) => (
          <Link
            key={principle.slug}
            href="/studio"
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
