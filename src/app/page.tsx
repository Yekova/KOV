import type { Metadata } from "next";
import { HeroScene } from "@/scenes/HeroScene";
import { ScreenShowcase } from "@/components/home/ScreenShowcase";
import { ExpertiseTeaser } from "@/components/home/ExpertiseTeaser";
import { WorkGallery } from "@/components/home/WorkGallery";
import { PhilosophyStatement } from "@/components/home/PhilosophyStatement";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { WorkSpotlight } from "@/components/home/WorkSpotlight";
import { ClosingCta } from "@/components/home/ClosingCta";
import GradualBlur from "@/components/home/GradualBlur";
import LineWaves from "@/components/home/LineWavesLazy";

export const metadata: Metadata = {
  alternates: { canonical: "https://kov-agency.site" },
};

// KOV's own tokens, not the upstream demo's arbitrary reds — same "mostly
// red, one muted channel" structure the demo's own defaults used.
const WAVE_COLOR_1 = "#777774"; // --kov-steel
const WAVE_COLOR_2 = "#E31E24"; // --kov-red
const WAVE_COLOR_3 = "#FF4D4D"; // --kov-red-signal

export default function Home() {
  return (
    <main className="relative">
      {/* One fixed background for the whole homepage scroll, not just the
          Hero — previously local to HeroScene, moved here so it persists
          behind every section as you scroll past Hero. `fixed`, not
          `absolute`: needs to stay put relative to the viewport regardless
          of page height/scroll position. */}
      <div className="fixed inset-0" style={{ zIndex: "var(--z-canvas)" }}>
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

      {/* No wrapping "content" div around the sections — --z-canvas is
          negative (tokens.css), which per CSS's own painting order already
          guarantees it sits behind plain, non-positioned content like
          these sections with no need to explicitly elevate them. (An
          earlier version wrapped everything in one `position:relative +
          z-content` div instead — that also fixed the canvas-vs-text
          problem, but it had a side effect: Nav lives inside HeroScene,
          nested inside that wrapper, and once trapped inside an ancestor's
          own stacking context a descendant's z-index can never "escape" to
          compete against something *outside* that ancestor — so Nav's own
          z-nav no longer counted against GradualBlur below, which sits
          outside the wrapper. GradualBlur painted over Nav. Fixing the
          canvas itself avoids needing this kind of wrapper at all.) */}
      <HeroScene />
      <ScreenShowcase screenshotSrc="/kov/home/dashboard-showcase.png" />
      <ExpertiseTeaser />
      <WorkGallery />
      <PhilosophyStatement />
      <ProcessTimeline />
      <WorkSpotlight />
      <ClosingCta />

      {/* A page-wide top blur, present through the whole scroll — content
          softens into it near the viewport edge instead of clipping hard
          against it. zIndex forced onto KOV's own scale (--z-glass, below
          --z-nav) via style, overriding the component's default +100
          offset which assumes a host page with no z-index system of its own. */}
      <GradualBlur
        position="top"
        target="page"
        height="8rem"
        strength={2}
        divCount={6}
        curve="ease-out"
        opacity={0.9}
        style={{ zIndex: "var(--z-glass)" as unknown as number }}
      />
    </main>
  );
}
