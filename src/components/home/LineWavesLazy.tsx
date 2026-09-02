"use client";

import dynamic from "next/dynamic";

// Defers ogl (and this shader-heavy component) out of the homepage's
// initial bundle — same reasoning as ShapeBlurLazy.tsx.
const LineWaves = dynamic(() => import("./LineWaves"), { ssr: false });

export default LineWaves;
