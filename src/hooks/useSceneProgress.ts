import { scenes, type Scene } from "@/data/scenes";

export interface SceneProgress {
  scene: Scene;
  index: number;
  /** Progress within the active scene only, 0 to 1. */
  localProgress: number;
}

// Maps global scroll progress to the active scene + progress within it,
// so components never hardcode scroll timings. See /docs/KOV-IMMERSIVE-SCENES.md.
export function useSceneProgress(globalProgress: number): SceneProgress {
  let index = scenes.findIndex(
    (scene) => globalProgress >= scene.scrollStart && globalProgress < scene.scrollEnd
  );
  if (index === -1) index = globalProgress >= 1 ? scenes.length - 1 : 0;

  const scene = scenes[index];
  const span = scene.scrollEnd - scene.scrollStart || 1;
  const localProgress = Math.min(1, Math.max(0, (globalProgress - scene.scrollStart) / span));

  return { scene, index, localProgress };
}
