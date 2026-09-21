"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { playerState } from "./playerState";

/** How near the visitor is, as the room reads it. The brief's distances,
 *  named so the scene can talk about intent rather than metres. */
export type Nearness = "far" | "lit" | "legible" | "named" | "reachable";

/** How close a stand has to be before it can be activated. Exported so
 *  the E key, the click target and the prompt that announces both read the
 *  same number — three places that would otherwise drift apart. */
export const REACH_DISTANCE = 1.5;

export const NEARNESS_RANGES: readonly { level: Nearness; within: number }[] = [
  { level: "reachable", within: REACH_DISTANCE },
  { level: "named", within: 3 },
  { level: "legible", within: 5 },
  { level: "lit", within: 8 },
];

export function nearnessAt(distance: number): Nearness {
  for (const range of NEARNESS_RANGES) {
    if (distance <= range.within) return range.level;
  }
  return "far";
}

/** Rank, for comparing two levels without a switch. */
const ORDER: Record<Nearness, number> = { far: 0, lit: 1, legible: 2, named: 3, reachable: 4 };
export const atLeast = (a: Nearness, b: Nearness) => ORDER[a] >= ORDER[b];

/** Watches one stand's distance and reports only when the band changes.
 *
 *  A distance recomputed every frame is cheap; a React render every frame
 *  is not, and one per stand would be a dozen. The callback fires on a
 *  crossing, which is a handful of times per visit.
 *
 *  Returns nothing: the caller owns the state it sets. */
export function useBrandProximity(
  position: readonly [number, number, number],
  onChange: (level: Nearness, distance: number) => void
) {
  const current = useRef<Nearness>("far");

  useFrame(() => {
    const dx = playerState.x - position[0];
    const dz = playerState.z - position[2];
    const distance = Math.hypot(dx, dz);
    const level = nearnessAt(distance);
    if (level !== current.current) {
      current.current = level;
      onChange(level, distance);
    }
  });
}
