"use client";

import { useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Brand } from "@/lib/studio/brands";
import { BrandStandMedia } from "./BrandStandMedia";
import { atLeast, useBrandProximity, type Nearness } from "./useBrandProximity";

const RED = "#e31e24";

// One brand, as a built position rather than as a card.
//
// A plinth, a back panel and a light. What the panel shows, and whether
// there is a volume on the plinth at all, comes from the tier — which is a
// capability, not a price: "showcase" means this stand may run a film,
// nothing about what it cost.
//
// Everything reacts to distance rather than to hover, because there is no
// hover in a room. The bands are useBrandProximity's, and the component
// re-renders only when one is crossed.
export function BrandStand({ brand, onInteract }: { brand: Brand; onInteract: (brand: Brand) => void }) {
  const [near, setNear] = useState<Nearness>("far");
  // What the stand's own light points at. One per stand, created once —
  // see the fixture below on why a spot needs an object to aim at.
  const panelTarget = useMemo(() => new THREE.Object3D(), []);

  useBrandProximity(brand.position, (level) => setNear(level));

  const lit = atLeast(near, "lit");
  const legible = atLeast(near, "legible");
  const named = atLeast(near, "named");
  const reachable = atLeast(near, "reachable");

  const [x, y, z] = brand.position;

  return (
    <group position={[x, y, z]} rotation={[0, brand.rotationY, 0]} scale={brand.scale}>
      {/* Plinth. Always there, lit or not — an empty position in a gallery
          is still architecture. */}
      <mesh position={[0, 0.45, 0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[1.6, 0.9, 0.7]} />
        <meshStandardMaterial color="#3a3a42" roughness={0.8} metalness={0.18} />
      </mesh>

      {/* The one red element: a line let into the plinth's top edge, which
          warms as the visitor approaches. */}
      <mesh position={[0, 0.905, 0.33]}>
        <boxGeometry args={[1.5, 0.012, 0.02]} />
        <meshBasicMaterial color={RED} toneMapped={false} transparent opacity={lit ? 0.85 : 0.18} />
      </mesh>

      {/* Back panel — the wall the brand's image lives on. */}
      <mesh position={[0, 1.85, -0.42]}>
        <boxGeometry args={[2.3, 2.9, 0.12]} />
        <meshStandardMaterial color="#2e2e34" roughness={0.9} metalness={0.05} />
      </mesh>

      <BrandStandMedia brand={brand} lit={lit} legible={legible} />

      {/* A volume on the plinth, for tiers that carry one. No GLB yet:
          model_url exists in the schema and nothing has been uploaded, and
          a loader that fetches nothing is a loader nobody can test. The
          placeholder is deliberately abstract — a KOV form, not a stand-in
          for someone's product. */}
      {(brand.tier === "immersive" || brand.tier === "exclusive") && (
        <mesh position={[0, 1.26, 0]} rotation={[0.3, 0.6, 0]}>
          <icosahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial
            color="#40404a"
            roughness={0.3}
            metalness={0.8}
            emissive={RED}
            emissiveIntensity={lit ? 0.22 : 0.04}
          />
        </mesh>
      )}

      {/* The picture light, and only while lit. A dozen always-on lights is
          a dozen shadow-free draws the renderer still has to solve per
          fragment; switching them with distance keeps the count at
          whatever the visitor is actually standing near.
          
          A spot aimed at the panel rather than a point light floating in
          front of it: a point light at this distance lit the plinth, the
          floor and the visitor's own feet as brightly as the work, which
          is the one thing a gallery fixture is designed not to do. The
          target has to be a real object in the graph — three.js aims a
          spot at an Object3D, and the default one sits at the world
          origin, which for a stand ten metres down the room means every
          light pointing back at the entrance. */}
      {lit && (
        <>
          <primitive object={panelTarget} position={[0, 1.95, -0.35]} />
          <spotLight
            position={[0, 3.35, 0.85]}
            target={panelTarget}
            angle={0.62}
            penumbra={0.75}
            intensity={legible ? 45 : 22}
            distance={6.4}
            decay={2}
            color="#ffdcba"
          />
        </>
      )}

      {/* The name, then the invitation. Both are real DOM through drei's
          Html, so they are readable text rather than pixels in a texture —
          and both are gated on distance, so nothing floats in the room
          until the visitor is at it. */}
      {named && (
        <Html
          position={[0, 0.62, 0.45]}
          center
          distanceFactor={6}
          // The room is walked with a locked pointer; a DOM layer that
          // accepted clicks would take them from the canvas.
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              fontFamily: "var(--font-geist-mono, monospace)",
              textTransform: "uppercase",
            }}
          >
            <span style={{ fontSize: 13, letterSpacing: "0.22em", color: "#f5f3ef" }}>{brand.name}</span>
            {reachable && (
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: "0.26em",
                  color: RED,
                  border: `1px solid ${RED}`,
                  borderRadius: 999,
                  padding: "4px 12px",
                }}
              >
                E · Découvrir
              </span>
            )}
          </div>
        </Html>
      )}

      {/* The click target. A plain invisible mesh rather than a DOM layer:
          in a pointer-locked room the only thing that can be clicked is
          what the camera is pointed at, and R3F raycasts from the centre
          of the screen for us. */}
      <mesh
        position={[0, 1.5, 0.2]}
        visible={false}
        onClick={(event) => {
          if (!reachable) return;
          event.stopPropagation();
          onInteract(brand);
        }}
      >
        <boxGeometry args={[2.4, 3, 1.4]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
