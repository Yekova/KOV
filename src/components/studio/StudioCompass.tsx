"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { CameraState } from "@/components/studio/CameraController";

interface StudioCompassProps {
  stateRef: RefObject<CameraState>;
}

// A real, live-reading compass, not a decorative icon — the dial's rotation
// comes directly from the camera's own yaw (the same ref CameraController
// writes every frame while dragging/inertia settles), polled here via
// requestAnimationFrame since this renders outside the R3F <Canvas> tree
// (no useFrame available on this side). North is yaw 0, each node's own
// authored "face forward" direction (studioNodes.ts). CameraController's
// own drag convention turns the camera left as yaw increases (dragging
// right "turns you left", Street-View style) — turning left means a
// fixed point in front of you drifts to your right, so the dial rotates
// clockwise (+yaw, no sign flip) as yaw grows. Direct DOM mutation, not
// React state, matching every other continuous per-frame update in this
// codebase — flag if this reads backwards live, the fix is a sign flip
// on `degrees` below.
export function StudioCompass({ stateRef }: StudioCompassProps) {
  const dialRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;
    function tick() {
      const dial = dialRef.current;
      if (dial) {
        const degrees = THREE.MathUtils.radToDeg(stateRef.current.yaw);
        dial.style.transform = `rotate(${degrees}deg)`;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stateRef]);

  return (
    <div
      aria-hidden="true"
      className="relative w-10 h-10 shrink-0 rounded-full flex items-center justify-center"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <div ref={dialRef} className="absolute inset-0 flex items-start justify-center pt-1.5">
        <span className="text-kov-red text-[9px] font-bold leading-none">N</span>
      </div>
      <span className="w-1 h-1 rounded-full" style={{ background: "var(--kov-steel)" }} />
    </div>
  );
}
