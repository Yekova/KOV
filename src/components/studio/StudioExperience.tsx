"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { animate } from "framer-motion";
import * as THREE from "three";
import { StudioIntro } from "@/components/studio/StudioIntro";
import { StudioHUD } from "@/components/studio/StudioHUD";
import { StudioCanvasContent } from "@/components/studio/StudioCanvasContent";
import { StudioNavigationOverlay } from "@/components/studio/StudioNavigationOverlay";
import { StudioErrorScreen } from "@/components/studio/StudioErrorScreen";
import { StudioErrorBoundary } from "@/components/studio/StudioErrorBoundary";
import { DEFAULT_FOV, type CameraState } from "@/components/studio/CameraController";
import { GlobalMenuProvider, useGlobalMenu } from "@/components/layout/GlobalMenuContext";
import { GlobalOverviewMenu } from "@/components/layout/GlobalOverviewMenu";
import { STUDIO_NODES, STUDIO_ENTRY_NODE_ID } from "@/config/studio/studioNodes";

// idle/loading collapse into "intro" (the intro screen itself carries a
// `textureReady` sub-state for its button) — a smaller state set than the
// spec's suggested six, but it maps to the same real UI states without a
// phase that never has distinct rendering. transitioning still fully
// blocks input, same guarantee (studio spec §31).
type EnginePhase = "intro" | "revealing" | "exploring" | "transitioning" | "error";

const REVEAL_DURATION_MS = 1200;
const NAV_OVERLAY_DELAY_MS = 300;
const NAV_TOTAL_DURATION_MS = 1400;

const DEBUG = process.env.NODE_ENV !== "production";

export function StudioExperience() {
  return (
    <GlobalMenuProvider>
      <StudioExperienceInner />
    </GlobalMenuProvider>
  );
}

function StudioExperienceInner() {
  const { open: menuOpen, toggle: toggleMenu, close: closeMenu } = useGlobalMenu();
  const [phase, setPhase] = useState<EnginePhase>("intro");
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [navOverlayActive, setNavOverlayActive] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const currentNode = STUDIO_NODES[STUDIO_ENTRY_NODE_ID];
  const cameraStateRef = useRef<CameraState>({
    yaw: currentNode.initialYaw,
    pitch: currentNode.initialPitch,
    fov: DEFAULT_FOV,
  });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  // Single loader, single source of truth: the same texture object used
  // for "is it ready" (the intro button) is the one actually handed to
  // PanoramaSphere — no separate drei/useTexture load racing this one
  // against a different completion signal for the same URL.
  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      currentNode.panorama,
      (loaded) => {
        if (cancelled) {
          loaded.dispose();
          return;
        }
        // LinearMipmapLinearFilter + generateMipmaps — was plain
        // LinearFilter with no mip chain, which also meant anisotropic
        // filtering (set in PanoramaSphere.tsx, where the renderer's
        // actual capability is queryable) had no mip levels to filter
        // across and was doing nothing. magFilter is Three.js's own
        // default (LinearFilter) — set explicitly here for the record.
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.minFilter = THREE.LinearMipmapLinearFilter;
        loaded.magFilter = THREE.LinearFilter;
        loaded.generateMipmaps = true;
        loaded.needsUpdate = true;
        setTexture(loaded);
      },
      undefined,
      () => {
        if (!cancelled) setPhase("error");
      }
    );
    return () => {
      cancelled = true;
    };
    // retryKey is otherwise inert — bumping it is purely what makes
    // handleRetry re-run this load after a failure.
  }, [currentNode.panorama, retryKey]);

  useEffect(() => () => texture?.dispose(), [texture]);

  function handleEnter() {
    if (!texture) return;
    setPhase("revealing");
    timersRef.current.push(setTimeout(() => setPhase("exploring"), REVEAL_DURATION_MS));
  }

  function handleRetry() {
    setTexture(null);
    setRetryKey((k) => k + 1);
    setPhase("intro");
  }

  const navigateToNode = useCallback(
    (targetId: string) => {
      if (phase !== "exploring") return;
      setPhase("transitioning");

      if (DEBUG) {
        console.info(`Navigation target: ${targetId}`);
      }

      const connection = currentNode.connections.find((c) => c.targetNodeId === targetId);
      if (connection && !reducedMotion) {
        const [x, , z] = connection.position;
        const targetYaw = Math.atan2(x, -z);
        const startYaw = cameraStateRef.current.yaw;
        // Shortest angular path, and only a partial nudge toward it — "un
        // mini travelling visuel", not a hard snap (studio spec §32).
        const deltaYaw = ((targetYaw - startYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
        animate(0, 1, {
          duration: 0.6,
          ease: "easeOut",
          onUpdate: (t) => {
            cameraStateRef.current.yaw = startYaw + deltaYaw * 0.3 * t;
          },
        });
      }

      timersRef.current.push(
        setTimeout(() => setNavOverlayActive(true), reducedMotion ? 0 : NAV_OVERLAY_DELAY_MS),
        setTimeout(
          () => {
            setNavOverlayActive(false);
            cameraStateRef.current.yaw = currentNode.initialYaw;
            cameraStateRef.current.pitch = currentNode.initialPitch;
            setPhase("exploring");
          },
          reducedMotion ? 500 : NAV_TOTAL_DURATION_MS
        )
      );
    },
    [phase, currentNode, reducedMotion]
  );

  if (phase === "error") {
    return <StudioErrorScreen onRetry={handleRetry} />;
  }

  const controlsEnabled = phase === "exploring";
  const canvasRevealed = phase !== "intro";

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#050505" }}>
      <div
        ref={setCanvasEl}
        className="absolute inset-0"
        style={{
          opacity: canvasRevealed ? 1 : 0,
          filter: canvasRevealed ? "blur(0px)" : reducedMotion ? "blur(0px)" : "blur(20px)",
          transition: reducedMotion
            ? "opacity 0.4s ease"
            : `opacity ${REVEAL_DURATION_MS}ms ease, filter ${REVEAL_DURATION_MS}ms ease`,
          cursor: controlsEnabled ? (dragging ? "grabbing" : "grab") : "default",
          touchAction: "none",
        }}
      >
        <Canvas
          // [min,max] — R3F clamps to the device's actual devicePixelRatio
          // within this range automatically (min(devicePixelRatio, 2), per
          // the quality audit's request), rather than a fixed value. Was
          // capped at 1.5, artificially softening the render on any
          // standard 2x-DPR display regardless of the source texture.
          dpr={[1, 2]}
          gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
          camera={{ fov: DEFAULT_FOV, near: 0.1, far: 1100, position: [0, 0, 0] }}
        >
          {/* Visible, non-black fallback — if the sphere ever fails to
              render for any reason, this reads as "something's off" (dark
              gray) rather than being indistinguishable from a total
              failure (pure black, same as the page's own backdrop). */}
          <color attach="background" args={["#111315"]} />
          <StudioErrorBoundary onError={() => setPhase("error")}>
            <StudioCanvasContent
              node={currentNode}
              texture={texture}
              domElement={canvasEl}
              cameraStateRef={cameraStateRef}
              controlsEnabled={controlsEnabled}
              reducedMotion={reducedMotion}
              debug={DEBUG}
              onDragStateChange={setDragging}
              onSelectHotspot={navigateToNode}
            />
          </StudioErrorBoundary>
        </Canvas>
      </div>

      {(phase === "intro" || phase === "revealing") && (
        <StudioIntro
          onEnter={handleEnter}
          ready={texture !== null}
          revealing={phase === "revealing"}
          revealDurationMs={REVEAL_DURATION_MS}
        />
      )}

      {(phase === "exploring" || phase === "transitioning") && (
        <StudioHUD node={currentNode} onToggleMenu={toggleMenu} menuOpen={menuOpen} />
      )}

      <StudioNavigationOverlay active={navOverlayActive} />

      <GlobalOverviewMenu open={menuOpen} onClose={closeMenu} />
    </div>
  );
}
