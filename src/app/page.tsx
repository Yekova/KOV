import type { Metadata } from "next";
import { HeroScene } from "@/scenes/HeroScene";
import { ExpertiseTeaser } from "@/components/home/ExpertiseTeaser";
import { WorkGallery } from "@/components/home/WorkGallery";
import { PhilosophyStatement } from "@/components/home/PhilosophyStatement";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { WorkSpotlight } from "@/components/home/WorkSpotlight";
import { ClosingCta } from "@/components/home/ClosingCta";
import { KovSectionIndicator } from "@/components/ui/KovSectionIndicator";

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
    </main>
  );
}
