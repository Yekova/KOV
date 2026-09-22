"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Brand } from "@/lib/studio/brands";
import { BrandStand } from "./BrandStand";
import { BrandGalleryExit } from "./BrandGalleryExit";
import {
  CEILING,
  GALLERY_BOXES,
  GALLERY_COVES,
  GALLERY_SLOTS,
  LEVEL_1,
  VOID_HALF,
  levelAt,
  type GalleryMaterial,
  type GallerySlot,
} from "./galleryLayout";
import { PlayerController } from "./PlayerController";
import { playerState } from "./playerState";

// The palette, from the drawings' own material board: béton minéral,
// pierre naturelle, métal brossé, bois noble — plus the glass of the
// balustrades and the two emissive strips.
//
// Dark grey, not black. Measured against three's own shading, near-black
// walls in a room lit like this land under 0.0017 linear, and the ACES
// curve clamps everything below that to exactly zero. A real gallery is
// not painted black either: it is painted dark and lit with hard falloff,
// and the blackness is in the contrast.
const MATERIALS: Record<GalleryMaterial, THREE.Material> = {
  concrete: new THREE.MeshStandardMaterial({ color: "#4e4e57", roughness: 0.93, metalness: 0.04 }),
  stone: new THREE.MeshStandardMaterial({ color: "#46464e", roughness: 0.55, metalness: 0.16 }),
  metal: new THREE.MeshStandardMaterial({ color: "#6d6d78", roughness: 0.3, metalness: 0.88 }),
  wood: new THREE.MeshStandardMaterial({ color: "#4b3b2c", roughness: 0.72, metalness: 0.05 }),
  // The balustrades. Transmission rather than opacity alone, because a
  // guard you cannot see through is a parapet, and the drawings are
  // explicit that it is glass.
  glass: new THREE.MeshPhysicalMaterial({
    color: "#cdd6e0",
    roughness: 0.08,
    metalness: 0,
    transmission: 0.82,
    thickness: 0.1,
    transparent: true,
    opacity: 0.34,
  }),
  // Additive, so a strip six centimetres wide still reads as a source
  // rather than as a pale line drawn on a wall. The cheapest glow there
  // is: no bloom pass, no second render target.
  warmLight: new THREE.MeshBasicMaterial({
    color: "#ffd2a4",
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
  redLine: new THREE.MeshBasicMaterial({
    color: "#e31e24",
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
};

/** A wash.
 *
 *  A spot aimed at a target, not a bare point light. A point light in a box
 *  lights the ceiling exactly as much as the floor, which is why an earlier
 *  pass of this room read as evenly grey; what makes a gallery look like a
 *  gallery is a pool with a soft edge and darkness between pools. The
 *  target has to be a real object in the graph — three.js aims a spot at an
 *  Object3D, and the default one sits at the world origin, which would
 *  point every fixture here at the same spot in the middle of the room. */
function Wash({
  from,
  at,
  intensity,
  color,
  angle = 1.1,
  distance = 14,
}: {
  from: [number, number, number];
  at: [number, number, number];
  intensity: number;
  color: string;
  angle?: number;
  distance?: number;
}) {
  const target = useMemo(() => new THREE.Object3D(), []);
  return (
    <>
      <primitive object={target} position={at} />
      <spotLight
        position={from}
        target={target}
        angle={angle}
        penumbra={0.9}
        intensity={intensity}
        distance={distance}
        decay={2}
        color={color}
      />
    </>
  );
}

/** The installation in the void.
 *
 *  Sixty rods of light hanging through the double height at scattered
 *  lengths — the one element in the drawings that is not architecture, and
 *  the thing the room is built around. Emissive rather than lit: sixty
 *  light sources would be sixty times the per-fragment cost, for an object
 *  nobody is reading by. */
function Installation() {
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.012, 0.012, 1, 6), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffe6c4",
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  // Deterministic, not random. A layout that reshuffles on every mount is
  // a different room each visit, and this one is meant to be a place.
  const rods = useMemo(() => {
    const out: { key: string; x: number; z: number; top: number; length: number }[] = [];
    for (let i = 0; i < 60; i += 1) {
      // A golden-angle spiral, which scatters without clumping.
      const t = i / 60;
      const radius = 0.5 + Math.sqrt(t) * (VOID_HALF - 2);
      const theta = i * 2.39996;
      const length = 1.4 + (((i * 37) % 23) / 23) * 3.4;
      out.push({
        key: `rod-${i}`,
        x: Math.cos(theta) * radius,
        z: 1 + Math.sin(theta) * radius,
        top: CEILING - 0.35,
        length,
      });
    }
    return out;
  }, []);

  return (
    <group>
      {rods.map((rod) => (
        <mesh
          key={rod.key}
          geometry={geometry}
          material={material}
          position={[rod.x, rod.top - rod.length / 2, rod.z]}
          scale={[1, rod.length, 1]}
        />
      ))}
    </group>
  );
}

/** Sixteen treads drawn over the ramp that actually carries the visitor.
 *
 *  Separating the two is the whole trick. A real staircase of colliders is
 *  a row of ledges to catch on, and a bare ramp in a gallery like this
 *  reads as a service lane. So the ramp is the physics, the treads are the
 *  architecture, and the two agree because both are generated from the
 *  same two ends. */
function Treads({ geometry }: { geometry: THREE.BufferGeometry }) {
  const treads = useMemo(() => {
    const count = 18;
    const bottomZ = 4.5;
    const topZ = -3.5;
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 0.5) / count;
      return {
        key: `tread-${i}`,
        position: [4.25, LEVEL_1 * t - 0.07, bottomZ + (topZ - bottomZ) * t] as [number, number, number],
      };
    });
  }, []);

  return (
    <group>
      {treads.map((tread) => (
        <mesh
          key={tread.key}
          geometry={geometry}
          material={MATERIALS.stone}
          position={tread.position}
          scale={[2.5, 0.14, 8 / 18 + 0.08]}
        />
      ))}
    </group>
  );
}

/** A position nobody occupies.
 *
 *  Marked rather than lit. A light of its own would read the same on screen
 *  and cost a shader recompile every time one came into range — three
 *  rebuilds a material's program whenever the light count changes — so the
 *  marker emits instead: a warm edge on the form and a ring let into the
 *  plinth, both visible from across the void at no per-fragment cost.
 *
 *  It also says the right thing. A lit stand is an exhibit; a glowing
 *  outline is an address waiting for one. */
function Vacancy({ slot, geometry }: { slot: GallerySlot; geometry: THREE.BufferGeometry }) {
  return (
    <group position={slot.position} rotation={[0, slot.rotationY, 0]}>
      <mesh position={[0, 0.45, 0]} geometry={geometry} material={MATERIALS.stone} scale={[1.6, 0.9, 0.7]} />
      <mesh position={[0, 1.34, 0]} rotation={[0.42, 0.8, 0]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color="#2f2f36"
          roughness={0.42}
          metalness={0.7}
          emissive="#ffd2a8"
          emissiveIntensity={0.12}
        />
      </mesh>
      <mesh position={[0, 0.906, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.46, 0.5, 48]} />
        <meshBasicMaterial color="#ffd2a8" toneMapped={false} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Which storey the visitor is on, reported when it changes.
 *
 *  In useFrame rather than in state, and pushed out only on a crossing:
 *  the height is read every frame and the HUD is told twice a visit. */
function LevelWatch({ onChange }: { onChange: (level: 0 | 1) => void }) {
  const current = useRef<0 | 1>(0);
  useFrame(() => {
    const level = levelAt(playerState.y);
    if (level !== current.current) {
      current.current = level;
      onChange(level);
    }
  });
  return null;
}

// The room.
//
// Nine washes and a hemisphere, plus one fixture per stand the visitor is
// standing at. Four wash the ground floor from under the mezzanine slab —
// which is where a fixture would actually be in this section — four wash
// the ring from the ceiling, and one drops through the void onto the
// lounge. That is the section drawing's own composition: each level lit
// from its own soffit, and one shaft through the middle.
//
// The hemisphere stands in for the bounce three does not compute. In a room
// whose walls face each other across a void that is most of the light there
// would be, and without it every vertical surface falls under the tone
// curve's black clamp.
//
// Shadows are off entirely. In a room of matte grey boxes under warm
// grazing light there is almost nothing for a shadow to land on that the
// geometry does not already imply, and the shadow map would be the single
// most expensive thing on screen — before counting that it would have to be
// cast through two storeys.
export function BrandGalleryScene({
  brands,
  controlsEnabled,
  onInteract,
  onExitZone,
  onLockChange,
  onLevelChange,
}: {
  brands: Brand[];
  controlsEnabled: boolean;
  onInteract: (brand: Brand) => void;
  onExitZone: (near: boolean) => void;
  onLockChange: (locked: boolean) => void;
  onLevelChange: (level: 0 | 1) => void;
}) {
  // Geometry is shared across every box; the material map above is shared
  // across every box of the same kind. Between them the shell, the
  // mezzanine, seventeen niches, the treads and the furniture are a couple
  // of hundred draws of one buffer rather than a couple of hundred buffers.
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  // Addresses no brand occupies. Left as volumes rather than as gaps: an
  // empty gallery should read as a gallery between shows, not as a page
  // with missing content. Keyed on all three axes now — two addresses can
  // share an x and a z and be a storey apart.
  const vacant = useMemo(() => {
    const key = (p: readonly [number, number, number]) =>
      `${Math.round(p[0])}:${Math.round(p[1])}:${Math.round(p[2])}`;
    const taken = new Set(brands.map((brand) => key(brand.position)));
    return GALLERY_SLOTS.filter((slot) => !taken.has(key(slot.position)));
  }, [brands]);

  return (
    <>
      <PlayerController enabled={controlsEnabled} onLockChange={onLockChange} />

      {/* Sky and bounce, in one light. A flat ambient lifts every face by
          the same amount, so a box lit only by ambient has no top and no
          side; a hemisphere gives the room a direction to be dark in —
          cool from above, a little warm off the stone. */}
      <hemisphereLight args={["#8fa2c0", "#6b543c", 3.4]} />

      {/* The ground floor, from under the mezzanine slab — which is where
          a fixture would actually be in this section.
          
          Mounted five metres off the wall with a very wide cone rather
          than tucked against it with a narrow one. Measured: at two and a
          half metres out, a single wash lit the middle of a wall to 172
          and left the addresses at either end of it at 30, which is a
          spotlit centre and two dark niches. Pulling it back lights the
          whole twenty-two metre face, and the sharp accent comes from the
          stand's own fixture instead. */}
      <Wash from={[0, 3.9, -5]} at={[0, 1.6, -10.8]} intensity={300} color="#ffd0a2" angle={1.45} distance={22} />
      <Wash from={[0, 3.9, 5]} at={[0, 1.6, 10.8]} intensity={300} color="#ffcb9c" angle={1.45} distance={22} />
      <Wash from={[-5, 3.9, 0]} at={[-10.8, 1.6, 0]} intensity={300} color="#ffd0a2" angle={1.45} distance={22} />
      <Wash from={[5, 3.9, 0]} at={[10.8, 1.6, 0]} intensity={300} color="#ffd0a2" angle={1.45} distance={22} />

      {/* The ring, from the ceiling. Warmer and stronger: the drawings call
          level 1 the premium floor, and the brightest band in the room is
          what makes a visitor take the stair. */}
      <Wash from={[0, 8.4, -5]} at={[0, 5.9, -10.8]} intensity={380} color="#ffdcb4" angle={1.45} distance={24} />
      <Wash from={[0, 8.4, 5]} at={[0, 5.9, 10.8]} intensity={380} color="#ffdcb4" angle={1.45} distance={24} />
      <Wash from={[-5, 8.4, 0]} at={[-10.8, 5.9, 0]} intensity={380} color="#ffdcb4" angle={1.45} distance={24} />
      <Wash from={[5, 8.4, 0]} at={[10.8, 5.9, 0]} intensity={380} color="#ffdcb4" angle={1.45} distance={24} />

      {/* One shaft through the void onto the lounge. */}
      <Wash from={[0, 8.6, 1.4]} at={[0, 0, 2]} intensity={280} color="#ffe2c0" angle={0.8} distance={18} />

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

      <Installation />
      <Treads geometry={geometry} />

      {brands.map((brand) => (
        <BrandStand key={brand.id} brand={brand} onInteract={onInteract} />
      ))}

      {vacant.map((slot) => (
        <Vacancy key={slot.id} slot={slot} geometry={geometry} />
      ))}

      <LevelWatch onChange={onLevelChange} />
      <BrandGalleryExit onNear={onExitZone} />
    </>
  );
}
