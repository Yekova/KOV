"use client";

import { useEffect, useState } from "react";
import { useImmersiveScrollProgress } from "@/hooks/useImmersiveScrollProgress";
import { useSceneProgress } from "@/hooks/useSceneProgress";

const FRAME_COUNT = 60;
const HERO_BASE = "/kov/home/hero-frames";
const ENTER_BASE = "/kov/home/enter-frames";

function frameUrl(basePath: string, index: number) {
  return `${basePath}/frame-${String(index).padStart(3, "0")}.jpg`;
}

function preload(basePath: string) {
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new window.Image();
    img.src = frameUrl(basePath, i);
  }
}

// Real scroll-scrubbed frame sequences for "hero" and "enter-screen" (see
// docs/KOV-IMMERSIVE-SCENES.md — this is the site's signature moment).
// "work" has no produced footage yet, so it holds on enter-screen's last
// frame rather than either cutting to a flat color or showing debug text —
// least jarring placeholder until that scene is produced.
export function SceneBackdrop() {
  const { progress, active } = useImmersiveScrollProgress();
  const { scene, localProgress } = useSceneProgress(progress);
  // Lazy initializer (not a setState-in-effect call) — see components/ui/Reveal.tsx
  // for why this avoids the extra render pass the naive version would cause.
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    preload(HERO_BASE);
    preload(ENTER_BASE);
  }, [reducedMotion]);

  let src: string;
  if (reducedMotion) {
    // Static keyframes only, no scrubbing — docs/KOV-IMMERSIVE-SCENES.md
    // accessibility section: replace long sequences with a few keyframes,
    // remove large movement, keep all content.
    src = scene.id === "hero" ? frameUrl(HERO_BASE, 0) : frameUrl(ENTER_BASE, FRAME_COUNT - 1);
  } else if (scene.id === "hero") {
    src = frameUrl(HERO_BASE, Math.round(localProgress * (FRAME_COUNT - 1)));
  } else if (scene.id === "enter-screen") {
    src = frameUrl(ENTER_BASE, Math.round(localProgress * (FRAME_COUNT - 1)));
  } else {
    src = frameUrl(ENTER_BASE, FRAME_COUNT - 1);
  }

  return (
    <div
      className="fixed inset-0 transition-opacity duration-500"
      style={{ zIndex: "var(--z-canvas)", opacity: active ? 1 : 0, pointerEvents: "none" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full h-full object-cover" />
    </div>
  );
}
