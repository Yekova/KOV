"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PROJECTS } from "@/data/projects";
import { prefersReducedMotion } from "@/lib/motion";
import { ProjectCard } from "@/components/home/projects/ProjectCard";
import { ProjectsHub } from "@/components/home/projects/ProjectsHub";
import { ConnectionsLayer, type Connection } from "@/components/home/projects/ConnectionsLayer";

// Vertical offsets, in pixels, applied per card. The grid stays a grid —
// three columns, two rows — and these break its symmetry just enough that
// the set reads as composed rather than tabulated. Small on purpose: past
// about 30px it stops looking deliberate and starts looking broken.
const CARD_OFFSETS = [-18, 16, 0, 22, -10, -26];

export function ProjectsNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hubLit, setHubLit] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [reducedMotion] = useState(() => prefersReducedMotion());

  // Measured, never hardcoded. Each line runs from the card edge that faces
  // the hub to the hub edge that faces back, with the control points pulled
  // halfway along the vertical gap — which is what turns a straight run into
  // the soft S the reference uses instead of an org chart's elbow.
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const hub = container.querySelector<HTMLElement>("[data-hub]");
    if (!hub) return;

    const base = container.getBoundingClientRect();
    const hubRect = hub.getBoundingClientRect();
    const hubCx = hubRect.left + hubRect.width / 2 - base.left;
    const hubTop = hubRect.top - base.top;
    const hubBottom = hubRect.bottom - base.top;
    const hubCy = (hubTop + hubBottom) / 2;

    const next: Connection[] = [];
    container.querySelectorAll<HTMLElement>("[data-project-card]").forEach((el) => {
      const id = el.dataset.projectCard;
      if (!id) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - base.left;
      const cy = r.top + r.height / 2 - base.top;

      const below = cy > hubCy;
      const sy = below ? r.top - base.top : r.bottom - base.top;
      const ey = below ? hubBottom : hubTop;
      const bend = (ey - sy) * 0.55;

      next.push({
        id,
        d: `M ${cx} ${sy} C ${cx} ${sy + bend}, ${hubCx} ${ey - bend}, ${hubCx} ${ey}`,
        nodeX: cx,
        nodeY: sy,
      });
    });

    setConnections(next);
    setBox({ width: base.width, height: base.height });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Measured on the next frame rather than synchronously: fonts and images
    // settle first, and a rect read before they do is the wrong rect.
    let raf = requestAnimationFrame(measure);
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    observer.observe(container);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [measure]);

  // The lines draw last, once there is something to draw along — the cards
  // and the hub arrive first, then the network that links them.
  useEffect(() => {
    if (connections.length === 0 || drawn) return;
    const timer = setTimeout(() => setDrawn(true), 260);
    return () => clearTimeout(timer);
  }, [connections.length, drawn]);

  return (
    <div
      ref={containerRef}
      className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-[150px]"
    >
      {PROJECTS.map((project, i) => (
        <div
          key={project.id}
          className="min-h-[260px] lg:min-h-[286px]"
          style={{ transform: `translateY(${reducedMotion ? 0 : CARD_OFFSETS[i] ?? 0}px)` }}
        >
          <ProjectCard
            project={project}
            index={i}
            hovered={hoveredId === project.id}
            dimmed={hoveredId !== null && hoveredId !== project.id}
            onHover={setHoveredId}
          />
        </div>
      ))}

      {/* The hub and the lines are a desktop reading. On a narrow screen the
          cards stack, there is no space between rows to route anything
          through, and a network drawn through a single column would be
          noise — so neither is rendered at all rather than hidden with CSS. */}
      <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <ProjectsHub lit={hubLit || hoveredId !== null} onHover={setHubLit} />
      </div>

      <div className="hidden lg:block">
        <ConnectionsLayer
          connections={connections}
          width={box.width}
          height={box.height}
          hoveredId={hoveredId}
          hubLit={hubLit}
          drawn={drawn}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}
