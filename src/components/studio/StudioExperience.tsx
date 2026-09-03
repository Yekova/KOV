"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { animate } from "framer-motion";
import * as THREE from "three";
import { StudioIntro } from "@/components/studio/StudioIntro";
import { StudioHUD } from "@/components/studio/StudioHUD";
import { StudioCanvasContent } from "@/components/studio/StudioCanvasContent";
import { StudioNavigationOverlay } from "@/components/studio/StudioNavigationOverlay";
import { StudioErrorScreen } from "@/components/studio/StudioErrorScreen";
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
  const [textureReady, setTextureReady] = useState(false);
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

  // A manual load (in parallel with drei's own useTexture cache inside the
  // Canvas) purely to know when the texture is actually ready for the
  // intro button and to catch a real network/decode failure — drei's
  // Suspense path resolves near-instantly once this has already primed
  // the browser's HTTP cache for the same URL.
  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      currentNode.panorama,
      () => {
        if (!cancelled) setTextureReady(true);
      },
      undefined,
      () => {
        if (!cancelled) setPhase("error");
      }
    );
    useTexture.preload(currentNode.panorama);
    return () => {
      cancelled = true;
    };
    // retryKey is otherwise inert — bumping it is purely what makes
    // handleRetry re-run this load after a failure.
  }, [currentNode.panorama, retryKey]);

  function handleEnter() {
    if (!textureReady) return;
    setPhase("revealing");
    timersRef.current.push(setTimeout(() => setPhase("exploring"), REVEAL_DURATION_MS));
  }

  function handleRetry() {
    setTextureReady(false);
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
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
          camera={{ fov: DEFAULT_FOV, near: 0.1, far: 1100, position: [0, 0, 0] }}
        >
          <StudioCanvasContent
            node={currentNode}
            domElement={canvasEl}
            cameraStateRef={cameraStateRef}
            controlsEnabled={controlsEnabled}
            reducedMotion={reducedMotion}
            debug={DEBUG}
            onDragStateChange={setDragging}
            onSelectHotspot={navigateToNode}
          />
        </Canvas>
      </div>

      {(phase === "intro" || phase === "revealing") && (
        <StudioIntro
          onEnter={handleEnter}
          ready={textureReady}
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
