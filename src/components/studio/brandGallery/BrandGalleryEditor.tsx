"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { GALLERY_COLLIDERS, GALLERY_SLOTS, levelAt } from "./galleryLayout";
import { playerState } from "./playerState";

// Placing a stand, in development only.
//
// BrandGalleryRoom mounts this behind NODE_ENV, so it is stripped from the
// production bundle rather than hidden by a flag someone can flip.
//
// It answers the only question that matters when authoring a position:
// where am I standing, and is that a sensible place for a plinth? Walk to
// the spot, press P, paste the three numbers into the row. The colliders
// are drawn as wireframes so a position that looks clear but sits inside a
// pier is obvious before it ships.
export function BrandGalleryEditor() {
  const readoutRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef("");

  useFrame(() => {
    const x = playerState.x.toFixed(2);
    const z = playerState.z.toFixed(2);
    // The floor the visitor is standing on, not their eye height: a stand
    // sits on the deck, and position_y in the row is where its plinth
    // meets it.
    const y = playerState.y.toFixed(2);
    const rotation = (((-playerState.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).toFixed(3);
    valueRef.current = `position_x: ${x}, position_y: ${y}, position_z: ${z}, rotation_y: ${rotation}`;
    if (readoutRef.current) {
      readoutRef.current.textContent = `N${levelAt(playerState.y)}  x ${x}  y ${y}  z ${z}  ry ${rotation}`;
    }
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "KeyP" || event.metaKey || event.ctrlKey) return;
      void navigator.clipboard?.writeText(valueRef.current).catch(() => {});
      console.info("[gallery editor]", valueRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {GALLERY_COLLIDERS.map((box) => (
        <mesh key={`collider-${box.id}`} position={box.position} scale={box.size}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#e31e24" wireframe transparent opacity={0.16} />
        </mesh>
      ))}

      {GALLERY_SLOTS.map((slot) => (
        <mesh
          key={`slot-${slot.id}`}
          position={[slot.position[0], slot.position[1] + 0.02, slot.position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.7, 0.78, 32]} />
          <meshBasicMaterial color="#4ad0ff" transparent opacity={0.45} />
        </mesh>
      ))}

      <Html fullscreen style={{ pointerEvents: "none" }}>
        <span
          ref={readoutRef}
          style={{
            position: "absolute",
            left: 16,
            top: 16,
            padding: "6px 10px",
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: 11,
            color: "#e7e7e5",
            background: "rgba(0,0,0,0.7)",
            borderRadius: 4,
          }}
        />
      </Html>
    </>
  );
}
