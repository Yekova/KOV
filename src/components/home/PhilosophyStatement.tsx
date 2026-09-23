import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionVeil } from "@/components/home/SectionVeil";

// Homepage-only copy, so it lives here rather than in src/data — that folder
// is for content shared across routes (PROCESS, PILLARS, SERVICES, FAQ all
// are). Same convention as StudioShowcase's own TEXT/STUDIO_PHOTOS.
const CONSTATS = [
  {
    number: "01",
    title: "Personne ne vous retient",
    body: "Votre site fonctionne, mais ressemble à celui des autres.",
  },
  {
    number: "02",
    title: "Le visiteur ne sait pas où aller",
    body: "Beaucoup d'informations. Peu de direction.",
  },
  {
    number: "03",
    title: "Votre site s'arrête à sa mise en ligne",
    body: "Il devrait pouvoir évoluer avec votre activité.",
  },
  {
    number: "04",
    title: "Le design ne produit rien",
    body: "Une belle interface ne suffit pas si elle n'aide ni à comprendre ni à agir.",
  },
] as const;

// Where the page stops talking about itself and starts describing the
// visitor's situation. It is the hinge of the second half: everything before
// it is what KOV does, everything after is how that gets delivered.
//
// A ledger, not a grid. No cards, no boxes, no glass — four full-width rows
// on hairlines, with the whitespace doing the work. A card grid here would
// turn four uncomfortable statements into four tidy product features, which
// is the opposite of the intended effect.
//
// Stays a Server Component: text and CSS only. Reveal is "use client" but a
// Server Component may render it (same arrangement as src/app/faq/page.tsx).
export function PhilosophyStatement() {
  return (
    <section id="philosophy" className="relative px-6 py-20 md:py-32 max-w-[1600px] mx-auto scroll-mt-40">
      {/* Black ground with a cursor-lit hole in it — see SectionVeil. It
          replaces the radial scrim that was here: an opaque block reads
          better behind text, and the halo gives back a glimpse of the
          animated background it covers. The content below must stay inside
          its own `relative` wrapper, or the veil paints over it. */}
      <SectionVeil />
      <div className="relative">
      <Reveal variant="blur">
        <SectionHeading
          eyebrow="Constats"
          title={
            <>
              Le problème n&apos;est
              <br />
              pas toujours le site<span className="text-kov-red">.</span>
            </>
          }
        />
      </Reveal>

      {/* The gap between the header and the list is where "lots of
          whitespace" actually lives — as spacing, not as empty divs. */}
      <ol className="list-none mt-24 md:mt-32 border-t" style={{ borderColor: "var(--kov-border)" }}>
        {CONSTATS.map((constat, index) => (
          <Reveal
            as="li"
            key={constat.number}
            delay={index * 0.08}
            className="grid grid-cols-1 md:grid-cols-[104px_1fr] lg:grid-cols-[minmax(110px,0.55fr)_minmax(0,1.35fr)_minmax(0,1.6fr)] gap-y-3 gap-x-10 xl:gap-x-16 lg:items-baseline py-10 md:py-12 lg:py-14 border-b"
            style={{ borderColor: "var(--kov-border)" }}
          >
            {/* Outlined, not filled: reads editorial at this size, and can
                never be mistaken for a statistic. The one on 04 is red —
                that's the constat the section argues toward, and the one
                that hands off to #process. Red appears exactly twice in
                this section; four red markers would be decoration. */}
            <span
              aria-hidden="true"
              className="font-display leading-none select-none"
              style={{
                // 8vw, not 14vw. Between md and lg the numeral sits in a
                // fixed gutter: at 768px, 14vw was a 108px glyph in an 88px
                // column, so every row overflowed its own gutter. 8vw gives
                // 61px there and still reaches the 132px cap on a wide
                // screen, where the lg layout gives it a flexible column.
                fontSize: "clamp(44px, 8vw, 132px)",
                color: "transparent",
                WebkitTextStroke:
                  constat.number === "04" ? "1px rgba(227,30,36,0.62)" : "1px rgba(231,231,229,0.26)",
              }}
            >
              {constat.number}
            </span>

            <h3
              className="font-display text-kov-bone uppercase self-center lg:self-baseline"
              style={{ fontSize: "clamp(20px, 2.2vw, 31px)", lineHeight: 1.05, letterSpacing: "-0.01em" }}
            >
              {constat.title}
            </h3>

            <p className="text-kov-concrete text-sm leading-relaxed" style={{ maxWidth: "46ch" }}>
              {constat.body}
            </p>
          </Reveal>
        ))}
      </ol>
      </div>
    </section>
  );
}
