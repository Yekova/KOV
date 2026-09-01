"use client";

import dynamic from "next/dynamic";

// Defers three.js (and this shader-heavy component) out of the initial
// bundle for every page that renders a KovCTA — it's a decorative,
// hover-only halo (opacity-0 until group-hover), so there's nothing to
// show during SSR or before hydration anyway.
const ShapeBlur = dynamic(() => import("./ShapeBlur"), { ssr: false });

export default ShapeBlur;
