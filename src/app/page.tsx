import type { Metadata } from "next";
import { HeroScene } from "@/scenes/HeroScene";
import { ExpertiseTeaser } from "@/components/home/ExpertiseTeaser";
import { WorkGallery } from "@/components/home/WorkGallery";
import { PhilosophyStatement } from "@/components/home/PhilosophyStatement";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { WorkSpotlight } from "@/components/home/WorkSpotlight";
import { ClosingCta } from "@/components/home/ClosingCta";
import { KovSectionIndicator } from "@/components/ui/KovSectionIndicator";
import GradualBlur from "@/components/home/GradualBlur";

export const metadata: Metadata = {
  alternates: { canonical: "https://kov-agency.site" },
};

const SECTIONS = [
  { id: "expertise", label: "Expertise" },
  { id: "work-gallery", label: "Projets" },
  { id: "philosophy", label: "Philosophie" },
  { id: "process", label: "Process" },
  { id: "contact", label: "Contact" },
];

export default function Home() {
  return (
    <main className="relative">
      <HeroScene />
      <ExpertiseTeaser />
      <WorkGallery />
      <PhilosophyStatement />
      <ProcessTimeline />
      <WorkSpotlight />
      <ClosingCta />
      <KovSectionIndicator sections={SECTIONS} />
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
