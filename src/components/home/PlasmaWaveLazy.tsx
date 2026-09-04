"use client";

import dynamic from "next/dynamic";

// Defers ogl (and this shader-heavy component) out of the initial bundle —
// same reasoning as ColorBendsLazy.tsx/LineWavesLazy.tsx/ShapeBlurLazy.tsx.
const PlasmaWave = dynamic(() => import("./PlasmaWave"), { ssr: false });

export default PlasmaWave;
