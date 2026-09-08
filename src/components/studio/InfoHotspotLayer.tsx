"use client";

import { InfoHotspot } from "@/components/studio/InfoHotspot";
import type { StudioInfoHotspot } from "@/config/studio/studioNodes";

interface InfoHotspotLayerProps {
  infoHotspots: StudioInfoHotspot[];
  disabled: boolean;
  onSelect: (hotspot: StudioInfoHotspot) => void;
}

// Generic — renders whatever info hotspots the current node's config
// lists, same pattern as HotspotLayer.tsx/ArtworkHotspotLayer.tsx. A node
// with none (most of them, for now) renders nothing.
export function InfoHotspotLayer({ infoHotspots, disabled, onSelect }: InfoHotspotLayerProps) {
  return (
    <>
      {infoHotspots.map((hotspot) => (
        <InfoHotspot key={hotspot.label} hotspot={hotspot} disabled={disabled} onSelect={onSelect} />
      ))}
    </>
  );
}
