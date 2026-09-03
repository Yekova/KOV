"use client";

import { Hotspot } from "@/components/studio/Hotspot";
import type { StudioConnection } from "@/config/studio/studioNodes";

interface HotspotLayerProps {
  connections: StudioConnection[];
  disabled: boolean;
  onSelect: (targetNodeId: string) => void;
}

// Generic — renders whatever connections the current node's config lists.
// Adding P02's own hotspots later needs no change here, only new entries
// in studioNodes.ts (studio spec §28).
export function HotspotLayer({ connections, disabled, onSelect }: HotspotLayerProps) {
  return (
    <>
      {connections.map((connection) => (
        <Hotspot key={connection.targetNodeId} connection={connection} disabled={disabled} onSelect={onSelect} />
      ))}
    </>
  );
}
