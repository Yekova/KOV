"use client";

import type { RefObject } from "react";
import type * as THREE from "three";
import { PanoramaSphere } from "@/components/studio/PanoramaSphere";
import { CameraController, type CameraState } from "@/components/studio/CameraController";
import { HotspotLayer } from "@/components/studio/HotspotLayer";
import { StudioDebugPanel } from "@/components/studio/StudioDebugPanel";
import type { StudioNode } from "@/config/studio/studioNodes";

interface StudioCanvasContentProps {
  node: StudioNode;
  texture: THREE.Texture | null;
  domElement: HTMLElement | null;
  cameraStateRef: RefObject<CameraState>;
  controlsEnabled: boolean;
  reducedMotion: boolean;
  debug: boolean;
  onDragStateChange: (dragging: boolean) => void;
  onSelectHotspot: (targetNodeId: string) => void;
}

// Everything that renders inside <Canvas> for the current node — kept
// generic (takes `node`, not a hardcoded P01 reference) so swapping in
// P02 later is a prop change, not a new component (studio spec §28).
export function StudioCanvasContent({
  node,
  texture,
  domElement,
  cameraStateRef,
  controlsEnabled,
  reducedMotion,
  debug,
  onDragStateChange,
  onSelectHotspot,
}: StudioCanvasContentProps) {
  return (
    <>
      {texture && <PanoramaSphere texture={texture} />}

      <CameraController
        domElement={domElement}
        stateRef={cameraStateRef}
        enabled={controlsEnabled}
        reducedMotion={reducedMotion}
        onDragStateChange={onDragStateChange}
      />

      <HotspotLayer connections={node.connections} disabled={!controlsEnabled} onSelect={onSelectHotspot} />

      {debug && <StudioDebugPanel stateRef={cameraStateRef} />}
    </>
  );
}
