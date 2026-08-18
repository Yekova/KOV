// KOV scene/scroll map — see /docs/KOV-IMMERSIVE-SCENES.md
// Central source of truth for scroll boundaries: never hardcode scene timings inside components.
//
// Boundaries below are placeholders (evenly divided) pending real keyframe content —
// tune scrollStart/scrollEnd once each scene's frames/sequences exist.

export interface Scene {
  id: string;
  scrollStart: number;
  scrollEnd: number;
}

export const scenes: Scene[] = [
  { id: "hero", scrollStart: 0, scrollEnd: 0.14 },
  { id: "enter-screen", scrollStart: 0.14, scrollEnd: 0.25 },
  { id: "expertise", scrollStart: 0.25, scrollEnd: 0.4 },
  { id: "design", scrollStart: 0.4, scrollEnd: 0.52 },
  { id: "development", scrollStart: 0.52, scrollEnd: 0.64 },
  { id: "work", scrollStart: 0.64, scrollEnd: 0.8 },
  { id: "process", scrollStart: 0.8, scrollEnd: 0.9 },
  { id: "contact", scrollStart: 0.9, scrollEnd: 1 },
];
