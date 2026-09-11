"use client";

import type { ReactNode } from "react";

export interface WidgetShellProps {
  className?: string;
  children: ReactNode;
  draggable: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: () => void;
}

// Shared chrome for all 7 hero widgets (spec §12/§13): sober dark glass —
// rgba(10,10,10,0.65), a barely-there white border, 18-24px radius, a
// moderate blur, a near-invisible shadow. No big glow, no blue tint.
//
// Native HTML5 drag-and-drop, not a library — framer-motion (already a
// dependency) provides the `layout` reflow animation on the grid item
// itself, and native DnD is all that's needed for the actual drag
// mechanics, so no new dependency (dnd-kit etc.) was added. The `draggable`
// prop this shell receives is only ever true while the pointer is down on
// the handle specifically (armed by the parent grid's onPointerDown/Up
// handlers below) — a plain click anywhere else in the card never starts
// a drag, so links/buttons inside each widget keep working normally.
export function WidgetShell({
  className = "",
  children,
  draggable,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: WidgetShellProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={`relative h-full w-full transition-[opacity,box-shadow,border-color] duration-150 ${className}`}
      style={{
        borderRadius: 20,
        background: "rgba(10,10,10,0.65)",
        border: `1px solid ${isDropTarget ? "rgba(227,30,36,0.5)" : "rgba(255,255,255,0.10)"}`,
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        boxShadow: isDragging ? "0 20px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(227,30,36,0.25)" : "0 1px 2px rgba(0,0,0,0.2)",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {children}
    </div>
  );
}

// The ⠿ handle itself — top-right, very quiet at rest (spec §07), a
// little more visible on hover, cursor:grab.
export function DragHandle(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className="absolute top-2.5 right-2.5 z-10 w-6 h-6 flex items-center justify-center rounded-md opacity-30 hover:opacity-70 transition-opacity"
      style={{ cursor: "grab" }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-kov-bone">
        <circle cx="2" cy="2" r="1.1" />
        <circle cx="6" cy="2" r="1.1" />
        <circle cx="10" cy="2" r="1.1" />
        <circle cx="2" cy="6" r="1.1" />
        <circle cx="6" cy="6" r="1.1" />
        <circle cx="10" cy="6" r="1.1" />
        <circle cx="2" cy="10" r="1.1" />
        <circle cx="6" cy="10" r="1.1" />
        <circle cx="10" cy="10" r="1.1" />
      </svg>
    </div>
  );
}
