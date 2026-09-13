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
// Dispatched by this component every time a real choice is recorded, with
// the value in `event.detail` — lets /legal/gestion-cookies (a separate
// component instance, reading the same storage key into its own state)
// refresh its displayed status the moment the banner above is used again,
// without needing a shared context or a page reload.
export const COOKIE_CONSENT_DECIDED_EVENT = "kov-cookie-consent-decided";

type Consent = "accepted" | "rejected" | null;

function readStoredConsent(): Consent {
  if (typeof window === "undefined") return null;
  // localStorage can throw (private-browsing storage caps, strict
  // cookie/site-data browser settings, some corporate policies) — treated
  // the same as "no choice yet" rather than left to crash the banner.
  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return stored === "accepted" || stored === "rejected" ? stored : null;
  } catch {
    return null;
  }
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
    // The banner must close on a real click regardless of whether
    // persisting the choice succeeds — a storage write that throws (see
    // readStoredConsent's own note) must not leave it stuck open forever.
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
    } catch {
      // Choice still applies for this session (consent state below still
      // updates); it just won't be remembered on the next visit.
    }
    setConsent(value);
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_DECIDED_EVENT, { detail: value }));
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
          // `env(safe-area-inset-bottom)` guards against mobile browsers'
          // own bottom toolbar overlapping (and eating clicks meant for)
          // a plain `bottom-4` fixed element — falls back to 0 on browsers
          // without the safe-area env vars.
          style={{ zIndex: "var(--z-modal)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
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
