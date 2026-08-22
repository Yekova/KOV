// A scene with real produced backdrop footage (see SceneBackdrop.tsx) but no
// HTML/editorial content of its own — docs/KOV-IMMERSIVE-SCENES.md describes
// "enter-screen" purely as a camera transformation, with no copy block (unlike
// Hero, which has one). A pure visual beat with no text overlay fits the
// documented rhythm ("WOW → SILENCE") better than inventing marketing copy
// that was never specified. Still needs real height so the scroll range this
// scene owns (see scenes.ts) stays in sync with SceneBackdrop's frame count.
export function SilentBeat({ id }: { id: string }) {
  return <section id={id} className="min-h-screen" aria-hidden="true" />;
}
