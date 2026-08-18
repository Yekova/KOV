// KOV scene/scroll map — see /docs/KOV-IMMERSIVE-SCENES.md
// Central source of truth for scroll boundaries: never hardcode scene timings inside components.
//
// IMPORTANT: these fractions must match the actual stacked height of each scene's
// section in the DOM. Right now every scene renders as a plain `min-h-screen`
// section, so the 8 scenes are evenly split (1/8 each). The moment a scene's real
// content makes it taller/shorter than 100vh, this file goes stale and the
// SceneBackdrop label will desync from what's on screen (caught by screenshot-testing
// the placeholder build — see project notes). At that point, replace this static
// array with a hook that measures each section's actual offsetTop/offsetHeight at
// runtime instead of hand-tuning fractions here.

export interface Scene {
  id: string;
  scrollStart: number;
  scrollEnd: number;
}

const SCENE_IDS = [
  "hero",
  "enter-screen",
  "expertise",
  "design",
  "development",
  "work",
  "process",
  "contact",
] as const;

export const scenes: Scene[] = SCENE_IDS.map((id, i) => ({
  id,
  scrollStart: i / SCENE_IDS.length,
  scrollEnd: (i + 1) / SCENE_IDS.length,
}));
