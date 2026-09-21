"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Brand } from "@/lib/studio/brands";
import { BrandStand } from "./BrandStand";
import { BrandGalleryExit } from "./BrandGalleryExit";
import { GALLERY_BOXES, GALLERY_COVES, GALLERY_SLOTS, type GalleryMaterial } from "./galleryLayout";
import { PlayerController } from "./PlayerController";

// The palette. Concrete, graphite, black stone, dark wood, smoked glass,
// warm light — and red exactly twice in the whole room: the line in the
// floor and the edge of each plinth.
const MATERIALS: Record<GalleryMaterial, THREE.Material> = {
  concrete: new THREE.MeshStandardMaterial({ color: "#16161a", roughness: 0.94, metalness: 0.04 }),
  graphite: new THREE.MeshStandardMaterial({ color: "#1c1c20", roughness: 0.7, metalness: 0.3 }),
  blackStone: new THREE.MeshStandardMaterial({ color: "#0d0d10", roughness: 0.82, metalness: 0.1 }),
  darkWood: new THREE.MeshStandardMaterial({ color: "#241c15", roughness: 0.78, metalness: 0.06 }),
  smokedGlass: new THREE.MeshPhysicalMaterial({
    color: "#0a0a0c",
    roughness: 0.18,
    metalness: 0,
    transmission: 0.45,
    transparent: true,
    opacity: 0.5,
  }),
  warmLight: new THREE.MeshBasicMaterial({ color: "#ffd2a4", toneMapped: false }),
  redLine: new THREE.MeshBasicMaterial({ color: "#e31e24", toneMapped: false }),
};

// The room.
//
// Lit by three fixed lights and a lot of emissive geometry rather than by
// one light per fixture: a dynamic light costs every fragment it reaches,
// and a gallery with a light in each cove would be paying for an evenly
// lit room the whole point of which is that it is not evenly lit. The
// coves are emissive strips — they read as the source without being one.
//
// Shadows are off entirely. In a room of matte black boxes under warm
// grazing light there is almost nothing for a shadow to land on that the
// ambient occlusion of the geometry does not already imply, and the shadow
// map would be the single most expensive thing on screen.
export function BrandGalleryScene({
  brands,
  controlsEnabled,
  onInteract,
  onExitZone,
  onLockChange,
}: {
  brands: Brand[];
  controlsEnabled: boolean;
  onInteract: (brand: Brand) => void;
  onExitZone: (near: boolean) => void;
  onLockChange: (locked: boolean) => void;
}) {
  // Geometry is shared across every box of the same size; the material
  // map above is shared across every box of the same kind. Between them
  // the room is a few dozen draws rather than a few hundred.
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  // Positions that no brand occupies. Left as volumes rather than as
  // gaps: an empty gallery should read as a gallery between shows, not as
  // a page with missing content.
  const vacant = useMemo(() => {
    const taken = new Set(
      brands.map((brand) => `${Math.round(brand.position[0])}:${Math.round(brand.position[2])}`)
    );
    return GALLERY_SLOTS.filter((slot) => !taken.has(`${Math.round(slot.position[0])}:${Math.round(slot.position[2])}`));
  }, [brands]);

  return (
    <>
      <PlayerController enabled={controlsEnabled} onLockChange={onLockChange} />

      {/* Barely there — enough that a black box is not a silhouette. */}
      <ambientLight intensity={0.16} color="#8fa3b8" />
      {/* Three fixed sources down the axis. Warm, low, and never moved. */}
      <pointLight position={[0, 4.1, 1]} intensity={16} distance={16} decay={2} color="#ffd0a0" />
      <pointLight position={[0, 4.1, -8]} intensity={14} distance={18} decay={2} color="#ffc99a" />
      <pointLight position={[0, 4.1, -16]} intensity={12} distance={14} decay={2} color="#ffd6ae" />

      {GALLERY_BOXES.map((box) => (
        <mesh
          key={box.id}
          geometry={geometry}
          material={MATERIALS[box.material]}
          position={box.position}
          scale={box.size}
        />
      ))}

      {GALLERY_COVES.map((cove) => (
        <mesh
          key={cove.id}
          geometry={geometry}
          material={MATERIALS[cove.material]}
          position={cove.position}
          scale={cove.size}
        />
      ))}

      {brands.map((brand) => (
        <BrandStand key={brand.id} brand={brand} onInteract={onInteract} />
      ))}

      {vacant.map((slot) => (
        <group key={slot.id} position={slot.position} rotation={[0, slot.rotationY, 0]}>
          {/* A KOV volume, not a "space available" sign. */}
          <mesh position={[0, 0.45, 0]} geometry={geometry} material={MATERIALS.blackStone} scale={[1.6, 0.9, 0.7]} />
          <mesh position={[0, 1.34, 0]} rotation={[0.42, 0.8, 0]}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color="#17171b" roughness={0.42} metalness={0.7} />
          </mesh>
        </group>
      ))}

      <BrandGalleryExit onNear={onExitZone} />
    </>
  );
}
