"use client";

import dynamic from "next/dynamic";

// /legal/layout.tsx is a Server Component, so the `ssr: false` boundary has
// to live in its own client module. Worth the extra file: LightPillar pulls
// in the whole of three.js, and importing it statically made every page of
// the legal hub — CGV, confidentialité, cookies, mentions — ship ~700 KB of
// WebGL engine ahead of its own text, for a decorative ambient glow.
//
// Nothing about the visual changes: the pillar is a `fixed`, pointer-events-
// none backdrop at --z-canvas with no server-rendered form, so there was
// never anything to paint before hydration anyway.
const LightPillar = dynamic(() => import("./LightPillar"), { ssr: false });

export default LightPillar;
