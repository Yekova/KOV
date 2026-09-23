"use client";

import { useCallback, useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { fetchBrands, type Brand } from "@/lib/studio/brands";
import { trackGallery } from "@/lib/studio/galleryAnalytics";
import { startGallerySink } from "@/lib/studio/gallerySink";
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
  const [level, setLevel] = useState<0 | 1>(0);
  const [active, setActive] = useState<Brand | null>(null);

  // Can this visitor actually walk?
  //
  // PlayerController drives the camera from `mousemove` under pointer
  // lock, and the movement keys come from `keydown`. A phone emits
  // neither, and pointer lock is a desktop API. Rendering the canvas
  // there handed someone a room they could not move in, with nothing on
  // screen saying why — the worst of both, because it looks like a bug.
  //
  // useMediaQuery rather than a state set from an effect: the site
  // already owns that hook, it is built on useSyncExternalStore, and it
  // answers correctly for a component that mounts after hydration, which
  // is exactly this one (the studio imports the room dynamically and
  // mounts it on arrival). So there is no first pass at the server's
  // answer and no flash of the wrong branch.
  const canWalk = useMediaQuery("(pointer: fine)");

  // Measurement runs for exactly as long as the visit does. Attached
  // before the brands are fetched so the first stand someone walks up to
  // is already counted, and torn down on the way out — which flushes
  // whatever is still queued.
  //
  // Gated on `canWalk`: a visitor who is shown the "come back from a
  // computer" panel never entered the room, and counting them as a visit
  // would quietly inflate every number the gallery reports.
  useEffect(() => {
    if (!canWalk) return;
    return startGallerySink();
  }, [canWalk]);

  useEffect(() => {
    if (!canWalk) return;
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
  }, [canWalk]);

  const handleInteract = useCallback((brand: Brand) => {
    setActive(brand);
    trackGallery("brand_stand_interact", { room_id: ROOM_ID, slot_id: brand.slotId, brand_id: brand.id, tier: brand.tier });
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
        // The same weighted vertical term useBrandProximity uses: a stand
        // on the ring is not within reach of someone standing under it.
        const distance = Math.hypot(
          playerState.x - brand.position[0],
          (playerState.y - brand.position[1]) * 2,
          playerState.z - brand.position[2]
        );
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

  // Placed after every hook, so the hook order is identical in both
  // branches. Says what the room needs and offers the way back, rather
  // than leaving someone pinching at a scene that will never move.
  if (!canWalk) {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-6" style={{ background: "#08080a" }}>
        <div className="max-w-sm text-center">
          <p className="flex items-center justify-center gap-3 text-xs uppercase tracking-widest text-kov-steel">
            <span aria-hidden="true" className="h-px w-7 bg-kov-red" />
            Brands Gallery
          </p>
          <h2 className="mt-6 font-display text-kov-bone uppercase text-2xl leading-tight">
            Cette salle se parcourt à la souris
          </h2>
          <p className="mt-5 text-kov-steel text-sm leading-relaxed">
            On s&apos;y déplace au clavier et on y regarde autour de soi à la souris, ce que votre appareil ne permet
            pas. Le reste du studio se visite normalement, et la galerie vous attend depuis un ordinateur.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="mt-8 inline-flex items-center gap-2 border px-5 py-3 text-xs uppercase tracking-widest text-kov-bone hover:text-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)" }}
          >
            Revenir au studio
          </button>
        </div>
      </div>
    );
  }

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
            Pushed out again with the room: the diagonal of a 22-metre
            square across two storeys is about 31 metres, and haze that
            starts before the far wall takes the contrast off the niche
            the visitor is walking toward. */}
        <fog attach="fog" args={["#0d0d10", 16, 52]} />

        <BrandGalleryScene
          brands={brands}
          controlsEnabled={active === null}
          onInteract={handleInteract}
          onExitZone={setNearExit}
          onLockChange={setLocked}
          onLevelChange={setLevel}
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
        level={level}
        onExit={onExit}
        onSelect={handleInteract}
      />

      {active && <BrandInteractionPanel brand={active} onClose={() => setActive(null)} />}
    </div>
  );
}
