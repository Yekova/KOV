import { SceneBackdrop } from "@/components/immersive/SceneBackdrop";
import { HeroScene } from "@/scenes/HeroScene";
import { PlaceholderScene } from "@/scenes/PlaceholderScene";
import { ExpertiseTeaser } from "@/components/home/ExpertiseTeaser";
import { WorkGallery } from "@/components/home/WorkGallery";
import { PhilosophyStatement } from "@/components/home/PhilosophyStatement";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { WorkSpotlight } from "@/components/home/WorkSpotlight";
import { HomeFooter } from "@/components/home/HomeFooter";
import { scenes } from "@/data/scenes";

const SCENE_LABELS: Record<string, string> = {
  "enter-screen": "ENTER",
  work: "WORK",
};

export default function Home() {
  return (
    <>
      {/* Immersive scroll-scrubbed intro — scenes.ts scrollStart/End are local to this zone only,
          see useImmersiveScrollProgress for how the rest of the page is excluded. */}
      <SceneBackdrop />
      <main className="relative" style={{ zIndex: "var(--z-content)" }}>
        {scenes.map((scene) =>
          scene.id === "hero" ? (
            <HeroScene key={scene.id} />
          ) : (
            <PlaceholderScene key={scene.id} id={scene.id} label={SCENE_LABELS[scene.id] ?? scene.id} />
          )
        )}

        {/* Regular (non-scene) sections below the immersive intro */}
        <ExpertiseTeaser />
        <WorkGallery />
        <PhilosophyStatement />
        <ProcessTimeline />
        <WorkSpotlight />
        <HomeFooter />
      </main>
    </>
  );
}
