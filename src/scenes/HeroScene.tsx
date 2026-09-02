import { KovCTA } from "@/components/ui/KovCTA";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import DepthCarousel from "@/components/home/DepthCarousel";

// The character/Studio portrait plus real KOV studio photography already
// shot for this site (used elsewhere — Expertise, the site-search panel,
// the old Hero background) — no stock imagery, no placeholders.
const CAROUSEL_IMAGES = [
  { image: "/kov/home/hero-character-studio.jpg", alt: "KOV Studio" },
  { image: "/kov/menu/atrium-brutaliste.jpg", alt: "Atrium — studio KOV" },
  { image: "/kov/menu/bureau-moderne.jpg", alt: "Bureau — studio KOV" },
  { image: "/kov/menu/couloir-brutaliste.jpg", alt: "Couloir — studio KOV" },
  { image: "/kov/menu/galerie-futuriste.jpg", alt: "Galerie — studio KOV" },
  { image: "/kov/menu/studio-industriel.jpg", alt: "Studio industriel — KOV" },
];

export function HeroScene() {
  return (
    <section id="hero" className="relative min-h-screen overflow-hidden">
      {/* No background color here on purpose — the animated LineWaves
          background now lives at the page level (src/app/page.tsx) so
          it's visible behind every homepage section, not just this one.
          An opaque background on this section would hide it completely
          for this section's entire height (the whole first viewport). */}

      <Nav variant="contained" />

      <div
        className="relative min-h-screen flex items-center px-6 md:px-16 pt-24 md:pt-28 pb-16"
        style={{ zIndex: "var(--z-content)" }}
      >
        <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-6 md:gap-8 items-center w-full max-w-[1600px] mx-auto">
          <div>
            <h1
              className="font-display text-kov-bone uppercase"
              style={{ fontSize: "clamp(24px, 3.5vw, 56px)", lineHeight: "var(--line-height-display)" }}
            >
              UNE VISION.
              <br />
              UNE EXÉCUTION<span className="text-kov-red">.</span>
            </h1>

            <p className="mt-8 max-w-md text-kov-concrete text-sm leading-relaxed">
              De la conception au motion, un seul studio pour maîtriser l&apos;exigence de chaque pixel.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-10">
              <KovCTA href="/contact">Démarrer un projet</KovCTA>
              <KovCTA href="/#work-gallery">Voir nos projets</KovCTA>
            </div>
          </div>

          {/* Real KOV studio photography, fanned into a depth stack — each
              card has its own shadow/rounding already, so this doesn't
              need a flat bordered frame. Arrows sit inside the component's
              own bounds, right against the card stack, with a red halo on
              hover. `isolation: isolate` keeps each card's very high
              internal z-index (ported from upstream, ~1900-3000, meant for
              a page with nothing else on it) contained to this box. */}
          <div className="w-full" style={{ height: "34rem", isolation: "isolate" }}>
            <DepthCarousel
              items={CAROUSEL_IMAGES}
              cardWidth={800}
              cardHeight={450}
              radius={18}
              tint="#0a0a0a"
              depth={400}
              spread={165}
              tilt={18}
              tiltDirection="right"
              perspective={1600}
              visibleCards={3}
              falloff={0.22}
              blur={5}
              autoplay={false}
              loop
              showIndicators={false}
            />
          </div>
        </div>
      </div>

      {/* Wrapped in its own h-screen box, pinned to the section's top,
          rather than a bare <HeroGlobalMenuButton /> as a direct child —
          the button's own `bottom-*` resolves against its nearest
          positioned ancestor, and this section is `min-h-screen`: if the
          content above (the now-larger carousel) ever pushes the section
          taller than one real viewport, `bottom-*` against the section
          itself would land below the visible fold, not at the bottom of
          what's actually on screen. `position:absolute` (not sticky/fixed)
          on this wrapper doesn't create its own stacking context, so it
          doesn't trap the button's z-index either. */}
      <div className="absolute inset-x-0 top-0 h-screen pointer-events-none">
        <div className="pointer-events-auto">
          <HeroGlobalMenuButton />
        </div>
      </div>
    </section>
  );
}
