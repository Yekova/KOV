"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { animate } from "framer-motion";
import * as THREE from "three";
import { StudioIntro } from "@/components/studio/StudioIntro";
import { StudioHUD } from "@/components/studio/StudioHUD";
import { StudioCanvasContent } from "@/components/studio/StudioCanvasContent";
import { StudioNavigationOverlay } from "@/components/studio/StudioNavigationOverlay";
import { StudioProjectPanel } from "@/components/studio/StudioProjectPanel";
import { StudioErrorScreen } from "@/components/studio/StudioErrorScreen";
import { StudioErrorBoundary } from "@/components/studio/StudioErrorBoundary";
import { DEFAULT_FOV, type CameraState } from "@/components/studio/CameraController";
import { GlobalMenuProvider, useGlobalMenu } from "@/components/layout/GlobalMenuContext";
import { GlobalOverviewMenu } from "@/components/layout/GlobalOverviewMenu";
import { STUDIO_NODES, STUDIO_ENTRY_NODE_ID, type StudioArtwork } from "@/config/studio/studioNodes";

// idle/loading collapse into "intro" (the intro screen itself carries a
// `textureReady` sub-state for its button) — a smaller state set than the
// spec's suggested six, but it maps to the same real UI states without a
// phase that never has distinct rendering. transitioning still fully
// blocks input, same guarantee (studio spec §31).
type EnginePhase = "intro" | "revealing" | "exploring" | "transitioning" | "error";

const REVEAL_DURATION_MS = 1200;
const NAV_OVERLAY_DELAY_MS = 300;
// Also doubles as the minimum floor a real node-to-node navigation waits
// before settling (see navigateToNode) — matches StudioNavigationOverlay's
// own fixed 1.1s cover animation (styled to start NAV_OVERLAY_DELAY_MS
// after this fires), so the swap below lands while the screen is still
// covered for the common case where the target texture is already warm.
const NAV_TOTAL_DURATION_MS = 1400;

const DEBUG = process.env.NODE_ENV !== "production";

// Single-purpose loader: same texture setup (colorSpace, mip chain, filter)
// used both for the entry node's load and every real inter-node navigation,
// so a node's panorama always ends up configured identically regardless of
// which of the two call sites loaded it.
function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.minFilter = THREE.LinearMipmapLinearFilter;
        loaded.magFilter = THREE.LinearFilter;
        loaded.generateMipmaps = true;
        loaded.needsUpdate = true;
        resolve(loaded);
      },
      undefined,
      reject
    );
  });
}

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
  const [currentNodeId, setCurrentNodeId] = useState(STUDIO_ENTRY_NODE_ID);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [navOverlayActive, setNavOverlayActive] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedArtwork, setSelectedArtwork] = useState<StudioArtwork | null>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const currentNode = STUDIO_NODES[currentNodeId];
  const cameraStateRef = useRef<CameraState>({
    yaw: currentNode.initialYaw,
    pitch: currentNode.initialPitch,
    fov: DEFAULT_FOV,
  });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  // Entry load only — single loader, single source of truth: the same
  // texture object used for "is it ready" (the intro button) is the one
  // actually handed to PanoramaSphere, no separate drei/useTexture load
  // racing this one against a different completion signal for the same
  // URL. Real inter-node navigation loads its own texture inside
  // navigateToNode below, since by then the engine is already past the
  // intro and needs a different transition (fade through
  // StudioNavigationOverlay, not the intro's blur-reveal) and a different
  // failure response (abort the transition, not a full-screen error).
  useEffect(() => {
    if (currentNodeId !== STUDIO_ENTRY_NODE_ID) return;
    let cancelled = false;
    loadTexture(STUDIO_NODES[STUDIO_ENTRY_NODE_ID].panorama)
      .then((loaded) => {
        if (cancelled) {
          loaded.dispose();
          return;
        }
        setTexture(loaded);
      })
      .catch(() => {
        if (!cancelled) setPhase("error");
      });
    return () => {
      cancelled = true;
    };
    // retryKey is otherwise inert — bumping it is purely what makes
    // handleRetry re-run this load after a failure.
  }, [currentNodeId, retryKey]);

  useEffect(() => () => texture?.dispose(), [texture]);

  // Warms the HTTP cache for every room reachable from here while the
  // visitor is still looking around — by the time they actually click a
  // hotspot, the target panorama's bytes are typically already local, so
  // the real load inside navigateToNode resolves fast enough to land
  // inside StudioNavigationOverlay's cover window instead of racing it.
  // Same fire-and-forget Image() prefetch idiom as MouseFrameBackdrop.tsx.
  useEffect(() => {
    if (phase !== "exploring") return;
    currentNode.connections.forEach((connection) => {
      const target = STUDIO_NODES[connection.targetNodeId];
      if (!target) return;
      const img = new window.Image();
      img.src = target.panorama;
    });
  }, [phase, currentNode]);

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
      const targetNode = STUDIO_NODES[targetId];
      if (!targetNode) return;

      setPhase("transitioning");
      setSelectedArtwork(null);

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

      timersRef.current.push(setTimeout(() => setNavOverlayActive(true), reducedMotion ? 0 : NAV_OVERLAY_DELAY_MS));

      const minWait = new Promise<void>((resolve) => {
        timersRef.current.push(setTimeout(resolve, reducedMotion ? 500 : NAV_TOTAL_DURATION_MS));
      });

      Promise.all([loadTexture(targetNode.panorama), minWait])
        .then(([loaded]) => {
          // The pre-existing `useEffect(() => () => texture?.dispose(), [texture])`
          // below disposes whatever texture this replaces once React commits
          // it — no manual dispose needed here.
          setTexture(loaded);
          setNavOverlayActive(false);
          setCurrentNodeId(targetId);
          cameraStateRef.current.yaw = targetNode.initialYaw;
          cameraStateRef.current.pitch = targetNode.initialPitch;
          cameraStateRef.current.fov = DEFAULT_FOV;
          setPhase("exploring");
        })
        .catch(() => {
          // A failed mid-experience navigation aborts the transition and
          // stays on the current, already-working node instead of tearing
          // down the whole 360° experience the visitor is already in —
          // StudioErrorScreen's full-screen takeover is reserved for the
          // initial load, where there's nothing yet to fall back to.
          if (DEBUG) console.error(`Failed to load panorama for ${targetId}`);
          setNavOverlayActive(false);
          setPhase("exploring");
        });
    },
    [phase, currentNode, reducedMotion]
  );

  const handleSelectArtwork = useCallback((artwork: StudioArtwork) => {
    setSelectedArtwork(artwork);
  }, []);

  const handleCloseArtworkPanel = useCallback(() => setSelectedArtwork(null), []);

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
              onSelectArtwork={handleSelectArtwork}
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

      <StudioProjectPanel artwork={selectedArtwork} onClose={handleCloseArtworkPanel} />

      <GlobalOverviewMenu open={menuOpen} onClose={closeMenu} />
    </div>
  );
}
