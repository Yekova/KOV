"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, extend, useFrame, useThree, type ThreeElement, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial, type MeshLineMaterialParameters } from "meshline";
import * as THREE from "three";
import { CARD_H, CARD_W } from "./badgeArt";
import { createBadgeFaceTexture, createLanyardTexture } from "./badgeTextures";
import { badgeBodyGeometry, badgeFaceGeometry, FACE_Z } from "./badgeGeometry";
import "./Lanyard.css";

extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

// A KOV badge on a lanyard, hanging from the top of the frame, that you can
// grab and swing.
//
// Adapted from React Bits' Lanyard. The rope — four rigid bodies, three rope
// joints, a spherical joint at the clip, and a meshline following a
// Catmull-Rom through them — is kept as it was, because that is the part
// worth having. What changed:
//
//  - No card.glb and no lanyard.png. The card's outline is part of the
//    brief (rounded, with one corner cut off), which a texture swap cannot
//    produce, so the card is built from a THREE.Shape and both faces are
//    painted on a canvas at runtime. That removes a binary model, an image,
//    a GLTF loader and a texture loader from the page.
//  - TypeScript throughout, and the joint hooks are fed through one cast
//    rather than six.
//  - resolution follows the real canvas size instead of a hardcoded pair,
//    so the band keeps its width when the window is not 1000px wide.

export interface LanyardProps {
  /** Camera position. */
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  /** Band width. Wide enough that the repeating wordmark is legible. */
  bandWidth?: number;
}

export default function Lanyard({
  position = [0, 0, 20],
  gravity = [0, -40, 0],
  fov = 20,
  bandWidth = 1,
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="kov-lanyard">
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: true }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
      >
        <ambientLight intensity={Math.PI} />
        {/* Rapier boots from WebAssembly and suspends while it does. Without
            a boundary inside the Canvas that suspension escapes to whatever
            is above the page. */}
        <Suspense fallback={null}>
          <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
            <Band isMobile={isMobile} bandWidth={bandWidth} />
          </Physics>
        </Suspense>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}

function makeCurve() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  curve.curveType = "chordal";
  return curve;
}

const SEGMENT = {
  type: "dynamic",
  canSleep: true,
  colliders: false,
  angularDamping: 4,
  linearDamping: 4,
} as const;

function Band({
  isMobile,
  bandWidth,
  maxSpeed = 50,
  minSpeed = 0,
}: {
  isMobile: boolean;
  bandWidth: number;
  maxSpeed?: number;
  minSpeed?: number;
}) {
  const band = useRef<THREE.Mesh<MeshLineGeometry>>(null);

  // Rapier's joint hooks are typed RefObject<RapierRigidBody>, while React 19
  // types useRef(null) as RefObject<T | null>. Casting at the declaration —
  // rather than wrapping each argument in a helper — is what lets the refs be
  // handed straight to the hooks: passing a ref to a hook is fine, passing
  // one through a plain function during render is not. The bodies do exist by
  // the time Rapier resolves the joints on the first frame; the guards in
  // useFrame below still check, because the first frame is not the only one
  // that matters.
  const fixed = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>;
  const j1 = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>;
  const j2 = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>;
  const j3 = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>;
  const card = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>;

  const size = useThree((state) => state.size);

  // Scratch vectors, the two lagged band points, and the curve they feed —
  // everything the frame loop writes to.
  //
  // A ref, not a useMemo: a useMemo result is render output and must not be
  // mutated afterwards, which is exactly what a sixty-times-a-second frame
  // loop does to these. They also have to be allocated once rather than per
  // frame — four Vector3s a frame is four thousand objects a minute for the
  // collector to sweep up.
  const simRef = useRef({
    vec: new THREE.Vector3(),
    ang: new THREE.Vector3(),
    rot: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    lerp1: new THREE.Vector3(),
    lerp2: new THREE.Vector3(),
    seeded: false,
    curve: makeCurve(),
  });

  // Built once and disposed on unmount: three geometries and three textures
  // survive a re-render of this component, and none of them is cheap to
  // rebuild — the faces are each a 640x900 canvas.
  const assets = useMemo(
    () => ({
      face: badgeFaceGeometry(),
      body: badgeBodyGeometry(),
      front: createBadgeFaceTexture("front"),
      back: createBadgeFaceTexture("back"),
      bandTexture: createLanyardTexture(),
      // MeshLineMaterial's constructor takes a required parameters object,
      // so R3F needs `args`. It has to be a stable reference: a fresh object
      // literal each render reads to R3F as new constructor arguments and
      // rebuilds the material — and its shader — every frame the component
      // re-renders. The real resolution is applied as a prop just below.
      materialArgs: [{ resolution: new THREE.Vector2(1, 1) }] as [MeshLineMaterialParameters],
    }),
    []
  );

  useEffect(
    () => () => {
      assets.face.dispose();
      assets.body.dispose();
      assets.front.dispose();
      assets.back.dispose();
      assets.bandTexture.dispose();
    },
    [assets]
  );

  const [dragged, setDragged] = useState<THREE.Vector3 | null>(null);
  const [hovered, setHovered] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, CARD_H / 2 + 0.375, 0],
  ]);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    const sim = simRef.current;
    const { vec, ang, rot, dir, lerp1, lerp2, curve } = sim;

    if (dragged && card.current) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (!fixed.current || !j1.current || !j2.current || !j3.current || !card.current || !band.current) {
      return;
    }

    // The two middle joints are drawn at a lagged position rather than at
    // their true one: it is what stops the band from snapping into a hard
    // polyline every time the physics solver nudges a point.
    if (!sim.seeded) {
      lerp1.copy(j1.current.translation());
      lerp2.copy(j2.current.translation());
      sim.seeded = true;
    }
    ([
      [j1, lerp1],
      [j2, lerp2],
    ] as const).forEach(([ref, lerped]) => {
      const body = ref.current;
      if (!body) return;
      const clamped = Math.max(0.1, Math.min(1, lerped.distanceTo(body.translation() as THREE.Vector3)));
      lerped.lerp(body.translation() as THREE.Vector3, delta * (minSpeed + clamped * (maxSpeed - minSpeed)));
    });

    curve.points[0].copy(j3.current.translation());
    curve.points[1].copy(lerp2);
    curve.points[2].copy(lerp1);
    curve.points[3].copy(fixed.current.translation());
    band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));

    // A gentle counter-torque on the card's own yaw, so it settles facing
    // the camera instead of spinning forever after a throw.
    ang.copy(card.current.angvel() as THREE.Vector3);
    rot.copy(card.current.rotation() as unknown as THREE.Vector3);
    card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
  });

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    const body = card.current;
    if (!body) return;
    (event.target as Element).setPointerCapture(event.pointerId);
    setDragged(
      new THREE.Vector3()
        .copy(event.point)
        .sub(simRef.current.vec.copy(body.translation() as THREE.Vector3))
    );
  };

  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    (event.target as Element).releasePointerCapture(event.pointerId);
    setDragged(null);
  };

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...SEGMENT} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...SEGMENT}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...SEGMENT}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...SEGMENT}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...SEGMENT}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[CARD_W / 2, CARD_H / 2, 0.01]} />
          <group
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerUp={onPointerUp}
            onPointerDown={onPointerDown}
          >
            {/* Body, then the two painted faces laid on it. */}
            <mesh geometry={assets.body}>
              <meshPhysicalMaterial
                color="#141416"
                roughness={0.55}
                metalness={0.3}
                clearcoat={isMobile ? 0 : 0.6}
                clearcoatRoughness={0.2}
              />
            </mesh>
            <mesh geometry={assets.face} position={[0, 0, FACE_Z]}>
              <meshPhysicalMaterial
                map={assets.front}
                map-anisotropy={8}
                roughness={0.78}
                metalness={0.15}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.16}
              />
            </mesh>
            <mesh geometry={assets.face} position={[0, 0, -FACE_Z]} rotation={[0, Math.PI, 0]}>
              <meshPhysicalMaterial
                map={assets.back}
                map-anisotropy={8}
                roughness={0.78}
                metalness={0.15}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.16}
              />
            </mesh>

            {/* Clamp and ring — the hardware the band actually runs through. */}
            <mesh position={[0, CARD_H / 2 + 0.07, 0]}>
              <boxGeometry args={[0.42, 0.16, 0.1]} />
              <meshStandardMaterial color="#b9bbbe" roughness={0.3} metalness={0.95} />
            </mesh>
            <mesh position={[0, CARD_H / 2 + 0.27, 0]}>
              <torusGeometry args={[0.15, 0.032, 10, 26]} />
              <meshStandardMaterial color="#b9bbbe" roughness={0.3} metalness={0.95} />
            </mesh>
          </group>
        </RigidBody>
      </group>

      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          args={assets.materialArgs}
          color="white"
          depthTest={false}
          resolution={[size.width, size.height]}
          useMap={1}
          map={assets.bandTexture}
          repeat={[-3, 1]}
          lineWidth={bandWidth}
        />
      </mesh>
    </>
  );
}
