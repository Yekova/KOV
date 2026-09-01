"use client";

import dynamic from "next/dynamic";

// Defers the whole three.js fluid-simulation bundle out of /contact's
// initial JS — it's a full-viewport decorative background over the page's
// own solid black, so a blank moment before it mounts is invisible.
const LiquidEther = dynamic(() => import("./LiquidEther"), { ssr: false });

export default LiquidEther;
