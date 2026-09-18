import { Button } from "@/components/ui/Button";
import { KovCTA } from "@/components/ui/KovCTA";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

// The end of the page, and the half of "peak-end" that the homepage was
// missing entirely — this section used to render the single word "Contact".
//
// Centred, which every section above it is not. That break is the point: a
// left rail keeps you reading, a centred column asks you to stop and decide.
//
// The space comes from py-40/py-56, not from a taller section. No filler
// graphic, no top rule (the Footer draws one a moment later), and one Reveal
// around the whole block rather than three staggered ones — the closing
// moment should arrive as a single statement, not as a sequence of asks.
//
// ⚠ Footer.tsx renders a backdrop-filter: blur(64px) panel whose box starts
// 260px ABOVE the footer's own top edge (FOOTER_BLUR_OVERSHOOT_PX). It sits
// at zIndex -1 so it never blurs this text, but it does blur the LineWaves
// background behind the last 260px of this section. The bottom padding below
// is what keeps the CTAs clear of that band — trim it and they drift into it.
export function ClosingCta() {
  return (
    <section id="contact" className="px-6 py-40 md:py-56 max-w-[1600px] mx-auto scroll-mt-40">
      <Reveal variant="blur">
        <div className="max-w-[1000px] mx-auto">
          <SectionHeading
            align="center"
            size="xl"
            eyebrow="Commencer"
            title={
              <>
                Une idée en tête ?
                <br />
                On la construit<span className="text-kov-red">.</span>
              </>
            }
            lede="Parlez-nous de votre projet. Le premier échange sert simplement à comprendre où vous voulez aller."
          />

          <div className="mt-14 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8">
            {/* KovCTA with `flat` skips its ShapeBlur halo, so this adds no
                WebGL context — unlike Button variant="primary", which mounts
                one per instance via SpecularButtonEffect. `flat` already
                renders the arrow after the label, so it isn't typed here.
                This is the exact gesture HeroScene opens the page with: the
                first and last actions being the same object is the symmetry
                the ending wants. */}
            <KovCTA href="/contact" flat emphasis>
              Démarrer un projet
            </KovCTA>

            {/* `ghost` is the one Button variant excluded from the specular
                effect, so it is also WebGL-free, and it renders its children
                verbatim. Text against a filled pill is the hierarchy the
                section needs — two buttons of equal weight would split the
                decision instead of pointing at one. */}
            <Button href="/faq" variant="ghost">
              Une question d&apos;abord ? →
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
