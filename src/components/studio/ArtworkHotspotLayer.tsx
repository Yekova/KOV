"use client";

import { ArtworkHotspot } from "@/components/studio/ArtworkHotspot";
import type { StudioArtwork } from "@/config/studio/studioNodes";

interface ArtworkHotspotLayerProps {
  artworks: StudioArtwork[];
  disabled: boolean;
  onSelect: (artwork: StudioArtwork) => void;
}

// Generic — renders whatever artworks the current node's config lists,
// same pattern as HotspotLayer.tsx for room-to-room connections. A node
// with no artworks (P01) renders nothing.
export function ArtworkHotspotLayer({ artworks, disabled, onSelect }: ArtworkHotspotLayerProps) {
  return (
    <>
      {artworks.map((artwork) => (
        <ArtworkHotspot key={artwork.project.id} artwork={artwork} disabled={disabled} onSelect={onSelect} />
      ))}
    </>
  );
}
