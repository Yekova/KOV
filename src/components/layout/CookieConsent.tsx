"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Button } from "@/components/ui/Button";

export const COOKIE_CONSENT_STORAGE_KEY = "kov-cookie-consent";
// Dispatched by /legal/gestion-cookies after clearing the stored choice —
// this component is mounted once, globally (layout.tsx), so a page on the
// other side of the app has no direct handle to it; a window event is the
// simplest way to tell this specific mounted instance "show yourself
// again" without lifting consent into a context nobody else needs.
export const REOPEN_COOKIE_CONSENT_EVENT = "kov-reopen-cookie-consent";

type Consent = "accepted" | "rejected" | null;

function readStoredConsent(): Consent {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
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

  useEffect(() => {
    function handleReopen() {
      setConsent(null);
    }
    window.addEventListener(REOPEN_COOKIE_CONSENT_EVENT, handleReopen);
    return () => window.removeEventListener(REOPEN_COOKIE_CONSENT_EVENT, handleReopen);
  }, []);

  function decide(value: "accepted" | "rejected") {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
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
        // Back to the original bottom-left compact card (the full-width
        // bottom bar this replaced was a later redesign) — styled with the
        // site's flat glass recipe (Nav.tsx's `flat` variant: a plain
        // --glass-bg/--glass-border div, no GlassSurface SVG displacement
        // filter) rather than GlassSurface, which is the heavier of the
        // two liquid-glass treatments used across this codebase.
        <div
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm"
          style={{ zIndex: "var(--z-modal)" }}
        >
          <div
            style={{
              borderRadius: 20,
              background: "var(--glass-bg)",
              backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
              WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--glass-shadow-full)",
            }}
          >
            <div className="p-6">
              <p className="text-xs uppercase tracking-widest text-kov-steel mb-3">Cookies</p>
              <p className="text-kov-bone text-sm leading-relaxed mb-6">
                On utilise des cookies de mesure d&apos;audience pour comprendre comment le site est utilisé —
                uniquement avec votre accord.{" "}
                <Link
                  href="/legal/cookies"
                  className="text-kov-red hover:text-kov-red-signal transition-colors underline underline-offset-2"
                >
                  En savoir plus
                </Link>
              </p>
              <div className="flex items-center gap-3">
                <Button type="button" variant="primary" onClick={() => decide("accepted")} className="flex-1 justify-center">
                  Accepter
                </Button>
                <Button type="button" variant="secondary" onClick={() => decide("rejected")} className="flex-1 justify-center">
                  Refuser
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
