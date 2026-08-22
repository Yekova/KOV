import { HeroScene } from "@/scenes/HeroScene";
import { ExpertiseTeaser } from "@/components/home/ExpertiseTeaser";
import { WorkGallery } from "@/components/home/WorkGallery";
import { PhilosophyStatement } from "@/components/home/PhilosophyStatement";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { WorkSpotlight } from "@/components/home/WorkSpotlight";
import { ClosingCta } from "@/components/home/ClosingCta";

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
    </main>
  );
}
