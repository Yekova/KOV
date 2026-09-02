import { KovCTA } from "@/components/ui/KovCTA";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import DepthCarousel from "@/components/home/DepthCarousel";
import LineWaves from "@/components/home/LineWavesLazy";

// KOV's own tokens, not the upstream demo's arbitrary reds — same "mostly
// red, one muted channel" structure the demo's own defaults used.
const WAVE_COLOR_1 = "#777774"; // --kov-steel
const WAVE_COLOR_2 = "#E31E24"; // --kov-red
const WAVE_COLOR_3 = "#FF4D4D"; // --kov-red-signal

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
    <section id="hero" className="relative min-h-screen overflow-hidden" style={{ background: "var(--kov-black)" }}>
      <div className="absolute inset-0" style={{ zIndex: "var(--z-canvas)" }}>
        <LineWaves
          speed={0.3}
          innerLineCount={32}
          outerLineCount={36}
          warpIntensity={1.0}
          rotation={-45}
          edgeFadeWidth={0.0}
          colorCycleSpeed={1.0}
          brightness={0.16}
          color1={WAVE_COLOR_1}
          color2={WAVE_COLOR_2}
          color3={WAVE_COLOR_3}
          enableMouseInteraction
          mouseInfluence={2.0}
        />
      </div>

      <Nav variant="contained" />

      <div
        className="relative min-h-screen flex items-start px-6 md:px-16 pt-40 md:pt-48 pb-32"
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

          {/* Real KOV studio photography, fanned into a depth stack —
              each card has its own shadow/rounding already, so this
              doesn't need the flat single-image bordered frame the
              previous carousel used. Arrows sit inside the component's
              own bounds, right against the card stack. Each card also
              tilts toward the cursor and glows red near its edges on
              hover (TiltedCard/BorderGlow, nested inside DepthCarousel.tsx).
              `isolation: isolate` is load-bearing, not decoration: each
              card's z-index (ported from upstream, ~1900-2000, meant for a
              page with nothing else on it) would otherwise leak out of
              this box and compete directly against Nav/HeroGlobalMenuButton
              (z-nav, 50) in the page's own stacking context — 2000 > 50, so
              the carousel painted over the menu button entirely. Isolating
              here contains that range to just this box, so from the
              outside it's one auto-z-index unit like everything else. */}
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

      <HeroGlobalMenuButton />
    </section>
  );
}
