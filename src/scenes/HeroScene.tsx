import Image from "next/image";
import { KovCTA } from "@/components/ui/KovCTA";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import LineWaves from "@/components/home/LineWavesLazy";

const PHOTO_SRC = "/kov/home/hero-character-studio.jpg";
const PHOTO_ASPECT = "2048 / 1144";

// KOV's own tokens, not the upstream demo's arbitrary reds — same "mostly
// red, one muted channel" structure the demo's own defaults used.
const WAVE_COLOR_1 = "#777774"; // --kov-steel
const WAVE_COLOR_2 = "#E31E24"; // --kov-red
const WAVE_COLOR_3 = "#FF4D4D"; // --kov-red-signal

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
        className="relative min-h-screen flex items-center px-6 md:px-16"
        style={{ zIndex: "var(--z-content)" }}
      >
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center w-full max-w-[1600px] mx-auto">
          {/* CTAs on the left */}
          <div className="flex flex-wrap items-center gap-4">
            <KovCTA href="/contact">Démarrer un projet</KovCTA>
            <KovCTA href="/#work-gallery">Voir nos projets</KovCTA>
            <KovCTA href="/studio">Découvrir le studio</KovCTA>
          </div>

          {/* The photo, in its own bordered box rather than a full-bleed
              background — same "browser window" convention ScreenShowcase
              uses (a real frame, not a floating cutout). */}
          <div
            className="relative w-full border overflow-hidden mx-auto md:mx-0 md:ml-auto max-w-xl"
            style={{
              aspectRatio: PHOTO_ASPECT,
              borderColor: "var(--kov-border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "0 40px 90px rgba(0, 0, 0, 0.55)",
              background: "var(--kov-black)",
            }}
          >
            <Image
              src={PHOTO_SRC}
              alt="KOV Studio"
              fill
              sizes="(min-width: 768px) 576px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      <HeroGlobalMenuButton />
    </section>
  );
}
