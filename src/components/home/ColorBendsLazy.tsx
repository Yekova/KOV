"use client";

import dynamic from "next/dynamic";

// Defers three (and this shader-heavy component) out of the initial
// bundle — same reasoning as LineWavesLazy.tsx/ShapeBlurLazy.tsx.
const ColorBends = dynamic(() => import("./ColorBends"), { ssr: false });

export default ColorBends;
