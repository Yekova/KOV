"use client";

import type { RefObject } from "react";
import type * as THREE from "three";
import { PanoramaSphere } from "@/components/studio/PanoramaSphere";
import { StudioFloorMark } from "@/components/studio/StudioFloorMark";
import { CameraController, type CameraState } from "@/components/studio/CameraController";
import { HotspotLayer } from "@/components/studio/HotspotLayer";
import { ArtworkHotspotLayer } from "@/components/studio/ArtworkHotspotLayer";
import { InfoHotspotLayer } from "@/components/studio/InfoHotspotLayer";
import { StudioDebugPanel } from "@/components/studio/StudioDebugPanel";
import type { StudioNode, StudioArtwork, StudioInfoHotspot } from "@/config/studio/studioNodes";

interface StudioCanvasContentProps {
  node: StudioNode;
  texture: THREE.Texture | null;
  domElement: HTMLElement | null;
  cameraStateRef: RefObject<CameraState>;
  controlsEnabled: boolean;
  /** False forces zoom off whatever the room allows — a phone locks the
   * field of view wide open (see StudioExperience). */
  zoomAllowed?: boolean;
  reducedMotion: boolean;
  debug: boolean;
  onDragStateChange: (dragging: boolean) => void;
  onSelectHotspot: (targetNodeId: string) => void;
  onSelectArtwork: (artwork: StudioArtwork) => void;
  onSelectInfo: (hotspot: StudioInfoHotspot) => void;
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
  zoomAllowed = true,
  reducedMotion,
  debug,
  onDragStateChange,
  onSelectHotspot,
  onSelectArtwork,
  onSelectInfo,
}: StudioCanvasContentProps) {
  return (
    <>
      {texture && <PanoramaSphere texture={texture} />}
      {/* Under the visitor in every room — the nadir is the one part of an
          equirectangular panorama that always needs covering. */}
      {texture && <StudioFloorMark />}

      <CameraController
        domElement={domElement}
        stateRef={cameraStateRef}
        enabled={controlsEnabled}
        reducedMotion={reducedMotion}
        zoomEnabled={node.zoomEnabled && zoomAllowed}
        onDragStateChange={onDragStateChange}
      />

      <HotspotLayer connections={node.connections} disabled={!controlsEnabled} onSelect={onSelectHotspot} />

      <ArtworkHotspotLayer artworks={node.artworks} disabled={!controlsEnabled} onSelect={onSelectArtwork} />

      <InfoHotspotLayer infoHotspots={node.infoHotspots} disabled={!controlsEnabled} onSelect={onSelectInfo} />

      {debug && <StudioDebugPanel stateRef={cameraStateRef} texture={texture} />}
    </>
  );
}
