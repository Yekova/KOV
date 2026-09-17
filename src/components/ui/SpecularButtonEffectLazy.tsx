"use client";

import dynamic from "next/dynamic";

// Button.tsx renders this on every `primary`/`secondary` button, and Button
// itself sits in Nav and Footer — so importing the effect statically put ogl
// (~110 KB) into the critical bundle of literally every page on the site,
// for a hover-time decoration that most visitors never trigger.
//
// The component was already gated at runtime by an IntersectionObserver (it
// only builds a WebGL context once its host button is actually on screen),
// so deferring the *module* the same way changes nothing visually: the
// import now resolves on roughly the same beat the observer would have
// fired. ssr:false because a WebGL canvas has no server-rendered form.
export const SpecularButtonEffect = dynamic(
  () => import("./SpecularButtonEffect").then((m) => m.SpecularButtonEffect),
  { ssr: false }
);
