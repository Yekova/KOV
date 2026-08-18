import { SceneBackdrop } from "@/components/immersive/SceneBackdrop";
import { HeroScene } from "@/scenes/HeroScene";
import { PlaceholderScene } from "@/scenes/PlaceholderScene";
import { scenes } from "@/data/scenes";

const SCENE_LABELS: Record<string, string> = {
  "enter-screen": "ENTER",
  work: "WORK",
};

export default function Home() {
  return (
    <>
      <SceneBackdrop />
      <main className="relative" style={{ zIndex: "var(--z-content)" }}>
        {scenes.map((scene) =>
          scene.id === "hero" ? (
            <HeroScene key={scene.id} />
          ) : (
            <PlaceholderScene key={scene.id} id={scene.id} label={SCENE_LABELS[scene.id] ?? scene.id} />
          )
        )}
      </main>
    </>
  );
}
