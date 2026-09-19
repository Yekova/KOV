"use client";

import { useEffect, useRef } from "react";
import { badgeAssetsReady, paintBadgeFace, TEX_H, TEX_W } from "./badgeArt";
import "./Lanyard.css";

// The badge without the physics: the same canvas painter, mounted straight
// into the DOM.
//
// Shown to anyone whose OS asks for reduced motion. A card swinging on a
// rope is precisely what that setting is about, and the alternative — a
// WebGL scene with the animation disabled — would still download a physics
// engine to render a picture.
export function BadgeStill() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    paintBadgeFace(canvas, "front");

    let cancelled = false;
    void badgeAssetsReady().then(() => {
      if (cancelled) return;
      const current = canvasRef.current;
      if (current) paintBadgeFace(current, "front");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="kov-badge-still">
      <div aria-hidden="true" className="kov-badge-still__strap" />
      <div aria-hidden="true" className="kov-badge-still__clip" />
      <canvas
        ref={canvasRef}
        width={TEX_W}
        height={TEX_H}
        className="kov-badge-still__card"
        role="img"
        aria-label="Badge KOV : accès débloqué, −10 % sur votre site ou votre audit."
      />
    </div>
  );
}
