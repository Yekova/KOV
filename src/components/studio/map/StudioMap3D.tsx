"use client";

import { Component, useEffect, useState, type ReactNode, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Maximize2 } from "lucide-react";
import { prefersReducedMotion } from "@/lib/motion/reducedMotion";
import { StudioMapScene } from "@/components/studio/map/StudioMapScene";
import { StudioMapAccessibleNav } from "@/components/studio/map/StudioMapAccessibleNav";
import { StudioMapExpanded } from "@/components/studio/map/StudioMapExpanded";
import { StudioMapMaterialsProvider } from "@/components/studio/map/StudioMapMaterials";
import type { CameraState } from "@/components/studio/CameraController";

interface StudioMap3DProps {
  currentRoomId: string;
  onNavigate: (id: string) => void;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  /** The panorama's live camera state, for the view cone. */
  cameraStateRef?: RefObject<CameraState>;
  /** Rooms already entered during this visit. */
  visitedIds?: ReadonlySet<string>;
}

class StudioMapErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// Replaces the old 2D SVG StudioMiniMap with an isometric 3D architectural
// model of the building, generated from studioMapLayout.ts data (no GLB,
// no Blender) — same position in the HUD, same real navigation function
// (`onNavigate` is StudioExperience.tsx's own navigateToNode, called
// directly, never a parallel nav path). An error boundary around the
// Canvas falls back to the plain accessible room list if the 3D scene
// ever fails to render, so Studio navigation can never actually break.
export function StudioMap3D({
  currentRoomId,
  onNavigate,
  isExpanded,
  onExpand,
  onCollapse,
  cameraStateRef,
  visitedIds,
}: StudioMap3DProps) {
  // Hover was discarded here before (onHoverChange was a no-op). It is now
  // the thing that lights the arc leading to the room under the pointer.
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [reducedMotion] = useState(() => prefersReducedMotion());
  // This component only ever renders once StudioExperience.tsx reaches
  // its "exploring" phase (well past the intro, purely client-side —
  // `phase` always starts at "intro" identically on server and client),
  // so `window` is always available here; a one-time check is enough —
  // deciding whether to mount a second WebGL context isn't something
  // that needs to react to a live resize. Desktop/tablet gets a real
  // small 3D preview; mobile skips mounting the Canvas entirely (not
  // just CSS-hiding it) rather than paying for a WebGL context nobody
  // can usefully see or aim a cursor at on a phone screen.
  const [isDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);
  // This component is mounted late on purpose (StudioExperience waits for
  // an idle frame before building a second WebGL scene), so it fades itself
  // in rather than appearing out of nowhere a beat after the room does.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const appear = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translateY(0)" : "translateY(-6px)",
    transition: "opacity 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)",
  } as const;

  return (
    <>
      {isDesktop ? (
        <div
          data-tour="map"
          className="absolute top-20 right-6 md:top-24 md:right-8 p-3"
          style={{
            ...appear,
            width: 280,
            borderRadius: 16,
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--glass-shadow-full)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] uppercase tracking-widest text-kov-steel">Carte du studio</p>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Agrandir la carte"
              className="text-kov-steel hover:text-kov-red transition-colors"
            >
              <Maximize2 size={13} />
            </button>
          </div>
          <div className="relative" style={{ height: 230, borderRadius: 10, overflow: "hidden", background: "#0b0b0d" }}>
            <StudioMapErrorBoundary
              fallback={
                <div className="p-2 h-full overflow-y-auto">
                  <StudioMapAccessibleNav currentRoomId={currentRoomId} onSelect={onNavigate} visuallyHidden={false} />
                </div>
              }
            >
              {/* Mini LOD: dpr 1, no shadow map, no furniture beyond the
                  few pieces flagged `mini`, no labels — the expanded view
                  is where the full model lives. */}
              {/* Unmounted while the expanded map is open. It used to keep
                  running behind the full-screen modal — a live WebGL context
                  rendering something nobody could see, on top of the
                  expanded map's own and the panorama's. Three contexts where
                  two will do, on the machine already driving a 360° scene. */}
              {!isExpanded && (
              <Canvas
                dpr={1}
                gl={{
                  antialias: true,
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: 1.12,
                  outputColorSpace: THREE.SRGBColorSpace,
                }}
                frameloop="demand"
              >
                <color attach="background" args={["#0b0b0d"]} />
                <StudioMapMaterialsProvider>
                  <StudioMapScene
                    currentRoomId={currentRoomId}
                    onHoverChange={setHoveredId}
                    hoveredId={hoveredId}
                    onSelect={onNavigate}
                    reducedMotion={reducedMotion}
                    cameraStateRef={cameraStateRef}
                    visitedIds={visitedIds}
                    margin={0.95}
                  />
                </StudioMapMaterialsProvider>
              </Canvas>
              )}
            </StudioMapErrorBoundary>
          </div>
          <StudioMapAccessibleNav currentRoomId={currentRoomId} onSelect={onNavigate} />
        </div>
      ) : (
        <button
          type="button"
          onClick={onExpand}
          className="absolute top-20 right-6 px-3 py-2 flex items-center gap-2 text-kov-bone text-[10px] uppercase tracking-widest"
          style={{
            ...appear,
            borderRadius: "var(--radius-pill)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <Maximize2 size={12} />
          Carte
        </button>
      )}

      {isExpanded && (
        <StudioMapErrorBoundary
          fallback={
            <div
              className="fixed inset-0 flex items-center justify-center p-6"
              style={{ zIndex: "var(--z-modal)", background: "rgba(0,0,0,0.85)" }}
            >
              <div className="w-full max-w-sm p-6" style={{ borderRadius: 16, background: "var(--kov-black)", border: "1px solid var(--glass-border)" }}>
                <StudioMapAccessibleNav currentRoomId={currentRoomId} onSelect={onNavigate} visuallyHidden={false} />
                <button type="button" onClick={onCollapse} className="mt-4 text-kov-steel text-xs uppercase tracking-widest">
                  Fermer
                </button>
              </div>
            </div>
          }
        >
          <StudioMapExpanded
            currentRoomId={currentRoomId}
            onNavigate={onNavigate}
            onCollapse={onCollapse}
            cameraStateRef={cameraStateRef}
            visitedIds={visitedIds}
          />
        </StudioMapErrorBoundary>
      )}
    </>
  );
}
