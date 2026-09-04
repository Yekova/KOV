"use client";

import { useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CameraState } from "@/components/studio/CameraController";

interface StudioDebugPanelProps {
  stateRef: RefObject<CameraState>;
  texture: THREE.Texture | null;
}

const FPS_SAMPLE_INTERVAL_MS = 250;

// Dev-only (StudioExperience only mounts this when
// process.env.NODE_ENV !== "production" — never shipped, studio spec §43).
// Renders inside the Canvas so useFrame can read the live camera state and
// the renderer's own capabilities every frame; writes straight into the
// DOM via a ref rather than React state, since this updates continuously
// and nothing else needs to react to it. Extended per the quality audit
// to also surface the actual loaded resolution, canvas/DPR, GPU limits,
// and anisotropy — the numbers needed to tell "source too low-res" apart
// from "a renderer setting is throwing away quality it has".
export function StudioDebugPanel({ stateRef, texture }: StudioDebugPanelProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const { gl, size } = useThree();
  const frameCountRef = useRef(0);
  const lastSampleRef = useRef(0);
  const fpsRef = useRef(0);

  useFrame((_, delta) => {
    const el = elRef.current;
    if (!el) return;

    frameCountRef.current += 1;
    lastSampleRef.current += delta * 1000;
    if (lastSampleRef.current >= FPS_SAMPLE_INTERVAL_MS) {
      fpsRef.current = Math.round((frameCountRef.current * 1000) / lastSampleRef.current);
      frameCountRef.current = 0;
      lastSampleRef.current = 0;
    }

    const s = stateRef.current;
    const dpr = gl.getPixelRatio();
    const canvasW = Math.round(size.width * dpr);
    const canvasH = Math.round(size.height * dpr);
    const img = texture?.image as { width?: number; height?: number } | undefined;

    el.textContent = [
      `PANORAMA  ${img?.width ?? "?"} × ${img?.height ?? "?"}`,
      `CANVAS    ${canvasW} × ${canvasH}`,
      `DPR       ${dpr.toFixed(2)}`,
      `FOV       ${s.fov.toFixed(1)}°  (yaw ${THREE.MathUtils.radToDeg(s.yaw).toFixed(1)}°  pitch ${THREE.MathUtils.radToDeg(s.pitch).toFixed(1)}°)`,
      `GPU MAX TEXTURE  ${gl.capabilities.maxTextureSize}`,
      `ANISOTROPY  ${texture?.anisotropy ?? "?"}x (max ${gl.capabilities.getMaxAnisotropy()}x)`,
      `FPS       ${fpsRef.current}`,
    ].join("\n");
  });

  return (
    <Html fullscreen>
      <div
        ref={elRef}
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          padding: "10px 12px",
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: 11,
          lineHeight: 1.6,
          whiteSpace: "pre",
          color: "#e7e7e5",
          background: "rgba(0,0,0,0.7)",
          borderRadius: 4,
          pointerEvents: "none",
        }}
      />
    </Html>
  );
}
