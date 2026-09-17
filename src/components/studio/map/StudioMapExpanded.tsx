"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Image from "next/image";
import { X, Minus, RotateCcw } from "lucide-react";
import { motion } from "@/lib/motion/timing";
import { LIQUID_EASE } from "@/lib/motion/easing";
import { prefersReducedMotion } from "@/lib/motion/reducedMotion";
import { STUDIO_NODES, type StudioNode } from "@/config/studio/studioNodes";
import { STUDIO_MAP_LAYOUT } from "@/config/studio/studioMapLayout";
import { STUDIO_ROOM_TYPE_INFO } from "@/config/studio/studioMapFurniture";
import { StudioMapScene } from "@/components/studio/map/StudioMapScene";
import { StudioMapLabels } from "@/components/studio/map/StudioMapLabels";
import { StudioMapAccessibleNav } from "@/components/studio/map/StudioMapAccessibleNav";
import { StudioMapMaterialsProvider } from "@/components/studio/map/StudioMapMaterials";

const GLASS_PANEL = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  border: "1px solid var(--glass-border)",
} as const;

const LEVELS = [
  { id: null, label: "Tous" },
  { id: 0, label: "Niveau 0" },
  { id: 1, label: "Rooftop" },
] as const;

interface StudioMapExpandedProps {
  currentRoomId: string;
  onNavigate: (id: string) => void;
  onCollapse: () => void;
}

// The "grande fenêtre" mode — a portal-mounted overlay (same pattern as
// GlobalOverviewMenu.tsx) rather than a second modal system. Clicking a
// room here only *selects* it; navigation still goes through the exact
// same `onNavigate` (StudioExperience.tsx's real navigateToNode) that the
// mini map and room carousel use, via the CTA below.
export function StudioMapExpanded({ currentRoomId, onNavigate, onCollapse }: StudioMapExpandedProps) {
  const [visible, setVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [reducedMotion] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCollapse();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCollapse]);

  if (typeof document === "undefined") return null;

  const previewId = selectedId ?? hoveredId ?? currentRoomId;
  const previewNode: StudioNode | undefined = STUDIO_NODES[previewId];
  const previewLayout = STUDIO_MAP_LAYOUT[previewId];
  const typeInfo = previewLayout ? STUDIO_ROOM_TYPE_INFO[previewLayout.type] : null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Carte du studio, vue agrandie"
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: "var(--z-modal)",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        opacity: reducedMotion ? 1 : visible ? 1 : 0,
        transition: reducedMotion ? undefined : `opacity ${motion.normal}s ${LIQUID_EASE}`,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCollapse();
      }}
    >
      <div
        className="flex flex-col md:flex-row w-[95vw] h-[90dvh] md:w-[min(1180px,92vw)] md:h-[min(760px,86vh)] overflow-hidden"
        style={{
          ...GLASS_PANEL,
          borderRadius: 24,
          transform: reducedMotion ? undefined : visible ? "scale(1)" : "scale(0.95)",
          transition: reducedMotion ? undefined : `transform ${motion.normal}s ${LIQUID_EASE}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col min-w-0 h-[65%] md:h-auto md:flex-1">
          <div
            className="flex items-start justify-between gap-4 p-5 md:p-6 border-b shrink-0"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <div>
              <p className="font-display text-kov-bone uppercase text-lg md:text-xl">Carte du studio</p>
              <p className="text-kov-steel text-xs mt-1">Explorez l&apos;architecture du KOV Virtual Studio.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setResetToken((k) => k + 1);
                  setSelectedId(null);
                  setSelectedLevel(null);
                }}
                aria-label="Réinitialiser la vue"
                className="w-8 h-8 flex items-center justify-center text-kov-steel hover:text-kov-bone transition-colors"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Réduire la carte"
                className="w-8 h-8 flex items-center justify-center text-kov-steel hover:text-kov-bone transition-colors"
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Fermer la carte"
                className="w-8 h-8 flex items-center justify-center text-kov-steel hover:text-kov-red transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-0" style={{ background: "#0b0b0d" }}>
            <div className="absolute top-3 left-3 z-10 flex md:flex-col gap-1.5">
              {LEVELS.map((lvl) => (
                <button
                  key={String(lvl.id)}
                  type="button"
                  onClick={() => setSelectedLevel(lvl.id)}
                  className="px-2.5 py-1.5 text-[9px] uppercase tracking-widest transition-colors"
                  style={{
                    borderRadius: 8,
                    background: selectedLevel === lvl.id ? "var(--kov-red)" : "rgba(12,12,12,0.7)",
                    color: selectedLevel === lvl.id ? "var(--kov-white)" : "var(--kov-steel)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  {lvl.label}
                </button>
              ))}
            </div>

            <Canvas
              shadows
              dpr={[1, 1.5]}
              // Set explicitly rather than inherited. ACES is what keeps a dark
              // scene from crushing to a single black mass when the key light
              // is strong, and the exposure lift is the honest way to open the
              // shadows — as opposed to raising every material's colour, which
              // is what the palette had been drifting toward.
              gl={{
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.12,
                outputColorSpace: THREE.SRGBColorSpace,
              }}
              frameloop="demand"
              onPointerMissed={() => setSelectedId(null)}
            >
              <color attach="background" args={["#0b0b0d"]} />
              <StudioMapMaterialsProvider>
                <StudioMapScene
                  currentRoomId={currentRoomId}
                  onHoverChange={setHoveredId}
                  onSelect={setSelectedId}
                  reducedMotion={reducedMotion}
                  interactive
                  detailed
                  selectedLevel={selectedLevel}
                  focusId={selectedId}
                  resetToken={resetToken}
                  margin={0.88}
                />
                <StudioMapLabels
                  currentRoomId={currentRoomId}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  selectedLevel={selectedLevel}
                />
              </StudioMapMaterialsProvider>
            </Canvas>
            <StudioMapAccessibleNav currentRoomId={currentRoomId} onSelect={onNavigate} />
          </div>
        </div>

        <div
          className="w-full md:w-[290px] shrink-0 p-5 md:p-6 border-t md:border-t-0 md:border-l flex flex-col h-[35%] md:h-auto overflow-y-auto"
          style={{ borderColor: "var(--glass-border)" }}
        >
          {previewNode && (
            <>
              {previewNode.available && (
                <div className="relative w-full mb-4 overflow-hidden shrink-0" style={{ aspectRatio: "16/9", borderRadius: 10 }}>
                  <Image src={`/studio/thumbnails/${previewNode.id}.webp`} alt="" fill sizes="290px" className="object-cover" />
                  {previewNode.id === currentRoomId && (
                    <span
                      className="absolute top-2 left-2 px-2 py-1 text-[8px] uppercase tracking-widest text-kov-white flex items-center gap-1.5"
                      style={{ borderRadius: 6, background: "rgba(227,30,36,0.85)" }}
                    >
                      <span aria-hidden="true" className="w-1 h-1 rounded-full bg-white" />
                      Salle actuelle
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <p className="text-kov-red text-[10px] font-mono tracking-widest">{previewNode.room}</p>
                {typeInfo && (
                  <span
                    className="text-kov-steel text-[9px] uppercase tracking-widest px-2 py-0.5"
                    style={{ borderRadius: 999, border: "1px solid var(--glass-border)" }}
                  >
                    {typeInfo.label}
                  </span>
                )}
              </div>
              <p className="font-display text-kov-bone uppercase text-lg mt-2">{previewNode.name}</p>
              <p className="text-kov-steel text-xs mt-1">{previewNode.subtitle}</p>

              <div className="h-px my-4" style={{ background: "var(--glass-border)" }} />

              <p className="text-kov-steel text-[9px] uppercase tracking-widest">
                Niveau {previewLayout?.level ?? 0}
              </p>

              {typeInfo && (
                <ul className="mt-3 space-y-1.5">
                  {typeInfo.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-kov-bone text-[11px]">
                      <span aria-hidden="true" className="w-1 h-1 rounded-full shrink-0 bg-kov-red" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              {previewNode.connections.length > 0 && (
                <div className="mt-4">
                  <p className="text-kov-steel text-[9px] uppercase tracking-widest mb-2">Accessible depuis</p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewNode.connections.map((c) => (
                      <span
                        key={c.targetNodeId}
                        className="px-2 py-1 text-kov-bone text-[9px] font-mono tracking-widest"
                        style={{ borderRadius: 6, border: "1px solid var(--glass-border)" }}
                      >
                        {STUDIO_NODES[c.targetNodeId]?.room ?? c.targetNodeId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 min-h-4" />
              <div className="h-px mb-4" style={{ background: "var(--glass-border)" }} />

              {previewNode.available ? (
                <button
                  type="button"
                  onClick={() => onNavigate(previewNode.id)}
                  className="group w-full px-4 py-2.5 flex items-center justify-center gap-2 text-kov-white text-[11px] uppercase tracking-widest transition-colors shrink-0"
                  style={{ borderRadius: 10, background: "var(--kov-red)" }}
                >
                  Entrer dans la salle
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </button>
              ) : (
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">Bientôt disponible</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
