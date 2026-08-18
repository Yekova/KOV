"use client";

import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useSceneProgress } from "@/hooks/useSceneProgress";
import { scenes } from "@/data/scenes";

// Placeholder for the real frame-by-frame sequence / canvas (see /docs/KOV-IMMERSIVE-SCENES.md).
// Fixed full-viewport layer at z-canvas — swap the flat depth color for the actual
// scrubbed sequence once keyframes exist, keeping the same scene/progress inputs.
const DEPTHS = ["var(--kov-black)", "var(--kov-carbon)", "var(--kov-graphite)"];
const PLACEHOLDER_FRAME_COUNT = 48;

export function SceneBackdrop() {
  const progress = useScrollProgress();
  const { scene, index, localProgress } = useSceneProgress(progress);
  const frame = Math.round(localProgress * (PLACEHOLDER_FRAME_COUNT - 1)) + 1;

  return (
    <div
      className="fixed inset-0 flex items-end justify-center pb-10 transition-colors duration-500"
      style={{ zIndex: "var(--z-canvas)", background: DEPTHS[index % DEPTHS.length] }}
    >
      <div className="font-mono text-[11px] text-kov-steel tracking-widest uppercase text-center space-y-3">
        <p>placeholder sequence — replace with real frames</p>
        <p className="text-kov-concrete">
          {String(index + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")} — {scene.id}
        </p>
        <p>
          frame {String(frame).padStart(2, "0")} / {PLACEHOLDER_FRAME_COUNT}
        </p>
        <div className="w-48 h-px bg-kov-border relative mx-auto">
          <div
            className="absolute inset-y-0 left-0 bg-kov-red"
            style={{ width: `${localProgress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
