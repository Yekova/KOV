"use client";

import dynamic from "next/dynamic";

// Same rationale as ShapeBlurLazy/LiquidEtherLazy — defers three.js out of
// /expertise's initial bundle for this decorative particle effect.
export const ParticleImage = dynamic(() => import("./ParticleImage").then((m) => m.ParticleImage), { ssr: false });
