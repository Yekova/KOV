"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { EXIT } from "./galleryLayout";
import { playerState } from "./playerState";

// The way out is a doorway, not a button.
//
// Walking into the entrance offers the exit; taking it runs the studio's
// own transition, which closes the black, swaps the room and opens it
// again — the same path every other room change takes. An <a href> here
// would reload the studio from its intro.
export function BrandGalleryExit({ onNear }: { onNear: (near: boolean) => void }) {
  const near = useRef(false);
  const [glow, setGlow] = useState(false);

  useFrame(() => {
    const distance = Math.hypot(playerState.x - EXIT.position[0], playerState.z - EXIT.position[2]);
    const inside = distance <= EXIT.radius;
    if (inside !== near.current) {
      near.current = inside;
      setGlow(inside);
      onNear(inside);
    }
  });

  return (
    <group position={EXIT.position}>
      {/* The threshold, marked in the floor rather than signposted. */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[EXIT.radius - 0.06, EXIT.radius, 48]} />
        <meshBasicMaterial color="#e31e24" toneMapped={false} transparent opacity={glow ? 0.55 : 0.16} />
      </mesh>

      {/* A warm wash in the doorway, so the exit reads from down the axis
          as somewhere to walk toward. */}
      <pointLight position={[0, 2.6, 0.6]} intensity={glow ? 7 : 3.5} distance={7} decay={2} color="#ffcfa8" />
    </group>
  );
}
