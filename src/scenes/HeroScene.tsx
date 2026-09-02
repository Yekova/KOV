import Image from "next/image";
import { KovCTA } from "@/components/ui/KovCTA";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";

// Character in profile, "STUDIO" typography already composited into the
// shot. Source is only 1024x572 natively — upscaled 2x (lanczos + a light
// unsharp mask, see git history for the ffmpeg command) for retina
// headroom, but still displayed well under full-bleed (see the `max-w-2xl`
// contain box below) rather than stretched across the whole viewport,
// which is what was actually making the low native resolution visible.
const PHOTO_SRC = "/kov/home/hero-character-studio.jpg";
const PHOTO_ASPECT = "2048 / 1144";

// Bottom-weighted, not left-weighted — there's no single text column to
// favor one side for; the three CTAs sit low (3/4 height) on both left
// and right.
const BOTTOM_WEIGHTED_GRADIENT =
  "linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.1) 55%, rgba(10,10,10,0.55) 78%, rgba(10,10,10,0.85) 100%)";

export function HeroScene() {
  return (
    <section
      id="hero"
      className="group relative min-h-screen overflow-hidden"
      style={{ background: "var(--kov-black)" }}
    >
      {/* Contained, not full-bleed cover — "pulled back," with visible
          black margin around it (seamless against the section's own
          background) instead of cropped/stretched edge to edge. Plain CSS
          hover-zoom (no JS mouse tracking anymore — that was pulled per
          feedback in favor of something simpler). */}
      <div
        className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none"
        style={{ paddingBottom: "18vh" }}
      >
        <div
          className="relative w-full max-w-2xl transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ aspectRatio: PHOTO_ASPECT }}
        >
          <Image src={PHOTO_SRC} alt="" aria-hidden="true" fill sizes="(min-width: 768px) 672px, 100vw" className="object-contain" priority />
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: "var(--z-atmosphere)", background: BOTTOM_WEIGHTED_GRADIENT }}
      />

      <Nav variant="contained" />

      {/* Two CTAs left, one on the other side — no headline/subhead text,
          the image itself carries the "Studio" statement. All three sit
          at 3/4 of the section's height, all KovCTA (halo-on-hover glass
          pill) — the plain Button pill variant used here before wasn't
          the right treatment. */}
      <div
        className="absolute left-6 md:left-16 flex flex-wrap items-center gap-4"
        style={{ top: "75%", transform: "translateY(-50%)", zIndex: "var(--z-content)" }}
      >
        <KovCTA href="/contact">Démarrer un projet</KovCTA>
        <KovCTA href="/#work-gallery">Voir nos projets</KovCTA>
      </div>

      <div
        className="absolute right-6 md:right-16"
        style={{ top: "75%", transform: "translateY(-50%)", zIndex: "var(--z-content)" }}
      >
        <KovCTA href="/studio">Découvrir le studio</KovCTA>
      </div>

      <HeroGlobalMenuButton />
    </section>
  );
}
