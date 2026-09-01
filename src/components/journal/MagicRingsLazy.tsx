"use client";

import dynamic from "next/dynamic";

// Same rationale as ShapeBlurLazy/LiquidEtherLazy/ParticleImageLazy — defers
// three.js out of /journal's initial bundle. Purely decorative background,
// nothing to show during SSR anyway.
const MagicRings = dynamic(() => import("./MagicRings"), { ssr: false });

export default MagicRings;
