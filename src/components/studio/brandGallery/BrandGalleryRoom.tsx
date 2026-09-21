"use client";

import { useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { fetchBrands, type Brand } from "@/lib/studio/brands";
import { trackGallery } from "@/lib/studio/galleryAnalytics";
import { BrandGalleryScene } from "./BrandGalleryScene";
import { BrandGalleryHUD } from "./BrandGalleryHUD";
import { BrandInteractionPanel } from "./BrandInteractionPanel";
import { BrandGalleryEditor } from "./BrandGalleryEditor";
import { SPAWN } from "./galleryLayout";
import { playerState } from "./playerState";
import { REACH_DISTANCE } from "./useBrandProximity";

const ROOM_ID = "p04";
const DEBUG = process.env.NODE_ENV !== "production";

// The walkable room.
//
// Its own <Canvas>, not a branch inside the panorama one. The two share
// nothing: no sphere, no texture, no yaw/pitch camera, no hotspot layer,
// and a different camera rig entirely. Threading both through one canvas
// would mean every panorama room paying, in conditionals, for a room it
// never renders — the whole reason the node now carries a `kind`.
//
// Mounted only when the studio navigates here, and unmounted on the way
// out, so the geometry and the renderer exist for exactly as long as the
// visitor is inside.
export function BrandGalleryRoom({ onExit }: { onExit: () => void }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [nearExit, setNearExit] = useState(false);
  const [active, setActive] = useState<Brand | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchBrands().then((rows) => {
      if (cancelled) return;
      setBrands(rows);
      setReady(true);
    });
    trackGallery("brand_gallery_enter", { room_id: ROOM_ID });
    return () => {
      cancelled = true;
      trackGallery("brand_gallery_exit", { room_id: ROOM_ID });
    };
  }, []);

  const handleInteract = useCallback((brand: Brand) => {
    setActive(brand);
    trackGallery("brand_stand_interact", { room_id: ROOM_ID, brand_id: brand.id, tier: brand.tier });
    // The panel is DOM, and reading it means using the cursor — so the
    // room gives the pointer back rather than making the visitor press
    // Escape first and wonder why nothing is clickable.
    if (document.pointerLockElement) document.exitPointerLock();
  }, []);

  // E, as promised by the prompt on the plinth.
  //
  // Resolved on the keypress rather than tracked every frame: which stand
  // is nearest only matters at the instant someone asks. Held to the same
  // reach as the click target, so the two cannot disagree about whether a
  // stand is close enough — the prompt announces both.
  useEffect(() => {
    if (active) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "KeyE" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      let nearest: Brand | null = null;
      let best = REACH_DISTANCE;
      for (const brand of brands) {
        const distance = Math.hypot(playerState.x - brand.position[0], playerState.z - brand.position[2]);
        if (distance <= best) {
          best = distance;
          nearest = brand;
        }
      }
      if (nearest) handleInteract(nearest);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, brands, handleInteract]);

  return (
    <div className="absolute inset-0" style={{ background: "#08080a" }}>
      <Canvas
        dpr={[1, 2]}
        // A little over 1: ACES is a filmic curve and it holds the
        // highlights of the picture lights back hard, which in a room this
        // dark reads as underexposed rather than as moody.
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12 }}
        camera={{ fov: 68, near: 0.05, far: 80, position: SPAWN }}
        // Nothing in this room casts a shadow — see BrandGalleryScene on
        // why. Saying so here keeps the renderer from allocating the maps.
        shadows={false}
        style={{ cursor: locked ? "none" : "pointer" }}
      >
        <color attach="background" args={["#08080a"]} />
        {/* The room's own haze. Cheap, and it is what makes the far end of
            the axis read as far rather than as a wall at arm's length.
            Starting at thirteen metres now that the room is actually
            lit: any closer and the haze was taking the contrast off the
            stand the visitor is walking toward, which is the one thing
            the far end of the axis is for. */}
        <fog attach="fog" args={["#0d0d10", 13, 44]} />

        <BrandGalleryScene
          brands={brands}
          controlsEnabled={active === null}
          onInteract={handleInteract}
          onExitZone={setNearExit}
          onLockChange={setLocked}
        />

        {DEBUG && <BrandGalleryEditor />}
      </Canvas>

      {/* Black until the room has something to show, then a fade. Not a
          spinner: the studio has never used one, and a gallery that opens
          on a loading indicator opens on the wrong thing. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "#08080a",
          opacity: ready ? 0 : 1,
          transition: "opacity 900ms cubic-bezier(0.22,1,0.36,1)",
        }}
      />

      <BrandGalleryHUD
        brands={brands}
        locked={locked}
        nearExit={nearExit}
        onExit={onExit}
        onSelect={handleInteract}
      />

      {active && <BrandInteractionPanel brand={active} onClose={() => setActive(null)} />}
    </div>
  );
}
