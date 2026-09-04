"use client";

import { useState } from "react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";

const STORAGE_KEY = "kov-cookie-consent";

type Consent = "accepted" | "rejected" | null;

function readStoredConsent(): Consent {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "accepted" || stored === "rejected" ? stored : null;
}

// Gates Vercel Analytics/Speed Insights behind an actual decision instead
// of loading them unconditionally (which is what layout.tsx did before —
// simultaneously contradicting /privacy's own claim of using no analytics
// trackers). Both scripts only mount once `consent === "accepted"`; there
// is no third "necessary cookies only, no banner" path here, since
// analytics is the only non-essential thing this site loads.
//
// Reject is rendered with the same Button variant/size as Accept
// (secondary vs primary, not "primary button vs quiet text link") — CNIL
// guidance treats an accept/reject pair with unequal visual weight as
// invalidating the consent itself, so this isn't just a styling choice.
// No separate dismiss/close action either: closing without an explicit
// choice must not read as implicit acceptance.
export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(() => readStoredConsent());

  function decide(value: "accepted" | "rejected") {
    window.localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  }

  return (
    <>
      {consent === "accepted" && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}

      {consent === null && (
        // Full-width bar anchored to the bottom edge, not a floating
        // corner card — width="100%" on GlassSurface is safe here
        // specifically because its parent has a *definite* width (fixed +
        // inset-x-0 resolves to the real viewport width, not an
        // ambiguous auto-sized box) — the pattern that broke Nav's pill
        // was width:100% on a position:absolute child inside an
        // auto-sized parent; this is a normal-flow child of a
        // concretely-sized one, a different and safe case.
        <div className="fixed inset-x-0 bottom-0" style={{ zIndex: "var(--z-modal)" }}>
          <GlassSurface width="100%" height="auto" borderRadius={0} className="block">
            <div className="px-6 py-5 md:py-6 max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <p className="text-kov-bone text-sm leading-relaxed flex-1">
                <span className="text-kov-steel uppercase tracking-widest text-xs mr-2">Cookies</span>
                On utilise des cookies de mesure d&apos;audience pour comprendre comment le site est utilisé —
                uniquement avec votre accord.{" "}
                <Link
                  href="/privacy"
                  className="text-kov-red hover:text-kov-red-signal transition-colors underline underline-offset-2"
                >
                  En savoir plus
                </Link>
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <Button type="button" variant="secondary" onClick={() => decide("rejected")} className="flex-1 md:flex-initial justify-center">
                  Refuser
                </Button>
                <Button type="button" variant="primary" onClick={() => decide("accepted")} className="flex-1 md:flex-initial justify-center">
                  Accepter
                </Button>
              </div>
            </div>
          </GlassSurface>
        </div>
      )}
    </>
  );
}
