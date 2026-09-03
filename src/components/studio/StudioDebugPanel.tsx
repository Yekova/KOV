"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CameraState } from "@/components/studio/CameraController";

interface StudioDebugPanelProps {
  stateRef: RefObject<CameraState>;
}

// Dev-only (StudioExperience only mounts this when
// process.env.NODE_ENV !== "production" — never shipped, studio spec §43).
// Renders inside the Canvas so useFrame can read the live camera state
// every frame; writes straight into the DOM via a ref rather than React
// state, since this updates 60x/second and nothing else needs to react to
// it. Use this to read off exact yaw/pitch while positioning a hotspot,
// then paste those values into studioNodes.ts.
export function StudioDebugPanel({ stateRef }: StudioDebugPanelProps) {
  const elRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    const el = elRef.current;
    if (!el) return;
    const s = stateRef.current;
    const yawDeg = THREE.MathUtils.radToDeg(s.yaw).toFixed(1);
    const pitchDeg = THREE.MathUtils.radToDeg(s.pitch).toFixed(1);
    el.textContent = `yaw ${yawDeg}°  pitch ${pitchDeg}°  fov ${s.fov.toFixed(1)}°`;
  });

  return (
    <Html fullscreen>
      <div
        ref={elRef}
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          padding: "6px 10px",
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: 11,
          color: "#e7e7e5",
          background: "rgba(0,0,0,0.6)",
          borderRadius: 4,
          pointerEvents: "none",
        }}
      />
    </Html>
  );
}
