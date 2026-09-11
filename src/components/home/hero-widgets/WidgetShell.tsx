"use client";

import { useRef, type ReactNode } from "react";
import { GripVertical } from "lucide-react";

export interface WidgetShellProps {
  className?: string;
  children: ReactNode;
  draggable: boolean;
  /** This specific card is the one currently being dragged. */
  isDragging: boolean;
  /** Some *other* card in the grid is being dragged — dims this one so the
   * active card reads as clearly lifted out by contrast (spec §26). */
  isOtherDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: () => void;
}

// Shared chrome for all 7 hero widgets — layered "matière" per spec §04/§05:
// graphite base, a barely-there border, a near-invisible outer shadow plus
// an inner vignette, a faint top highlight, and a cursor-reactive radial
// sheen. Each layer stays extremely subtle on its own; together they read
// as "premium material" rather than a flat rgba fill with content on top.
//
// Native HTML5 drag-and-drop, not a library — framer-motion (already a
// dependency, used by the parent grid) provides the `layout` reflow
// animation, and native DnD is all the drag mechanics need, so no new
// dependency (dnd-kit etc.) was added. The `draggable` prop this shell
// receives is only ever true while the pointer is down on the handle
// specifically (armed by the parent grid) — a plain click anywhere else in
// the card never starts a drag, so links/buttons/tabs inside each widget
// keep working normally (spec §27).
export function WidgetShell({
  className = "",
  children,
  draggable,
  isDragging,
  isOtherDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: WidgetShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    shellRef.current!.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    shellRef.current!.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <div
      ref={shellRef}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onMouseMove={handlePointerMove}
      className={`group/shell relative h-full w-full transition-[opacity,transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 ${className}`}
      style={{
        borderRadius: 20,
        background: "rgba(7,7,7,0.78)",
        border: `1px solid ${isDropTarget ? "rgba(227,30,36,0.45)" : "rgba(255,255,255,0.09)"}`,
        boxShadow: isDragging
          ? "0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(227,30,36,0.3), inset 0 0 40px rgba(0,0,0,0.25)"
          : "0 20px 60px rgba(0,0,0,0.18), inset 0 0 40px rgba(0,0,0,0.22)",
        opacity: isDragging ? 1 : isOtherDragging ? 0.72 : 1,
        transform: isDragging ? "scale(1.015)" : undefined,
        cursor: draggable ? "grabbing" : undefined,
      }}
    >
      {/* Top highlight — a hairline of light along the upper edge, not a
          lit-up card. Painted first (DOM order), so real content (images,
          text) layers over it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: 20, background: "linear-gradient(to bottom, rgba(255,255,255,0.035), transparent 40%)" }}
      />
      {/* Cursor-reactive sheen — reads as material, not as a spotlight;
          opacity only rises on hover so it's inert until touched. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-0 group-hover/shell:opacity-100 transition-opacity duration-300"
        style={{
          borderRadius: 20,
          background: "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.05), transparent 55%)",
        }}
      />
      {isDropTarget && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: 20, boxShadow: "inset 0 0 0 1.5px rgba(227,30,36,0.5)" }}
        />
      )}
      {children}
    </div>
  );
}

// The ⠿ handle — quiet at rest, more visible on card hover, fully opaque
// with a small glass circle on its own hover (spec §08).
export function DragHandle(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className="group/handle absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-full opacity-35 group-hover/shell:opacity-70 hover:!opacity-100 transition-all duration-200"
      style={{ cursor: "grab" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full opacity-0 group-hover/handle:opacity-100 transition-opacity duration-200"
        style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}
      />
      <GripVertical size={13} className="relative text-kov-bone" strokeWidth={2} />
    </div>
  );
}
