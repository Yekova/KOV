"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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

/** "unknown" is the server's answer and the client's first, pre-hydration
 *  one. It is not a third kind of consent, it is the absence of a reading. */
type Consent = "accepted" | "rejected" | "none" | "unknown";

// Why this is read through useSyncExternalStore and not a lazy useState.
//
// The previous version initialised state with a localStorage read. The
// server has no localStorage, so it always rendered the banner; a returning
// visitor's browser read "accepted" on its very first pass and rendered
// nothing. That is a hydration mismatch on the exact subtree in question,
// and a subtree React fails to hydrate keeps the server's markup with none
// of its handlers attached: visible, and inert to clicks and hover alike,
// which is precisely how this banner was reported.
//
// useSyncExternalStore is the one primitive that distinguishes "first
// render of a hydrating tree" from "first render of something mounted
// later", and answers each correctly. It also removes the local state
// entirely: localStorage is the single source of truth, and the component
// re-reads it whenever something says it changed.
function subscribe(onChange: () => void) {
  // `storage` covers another tab; the two custom events cover this one.
  window.addEventListener("storage", onChange);
  window.addEventListener(REOPEN_COOKIE_CONSENT_EVENT, onChange);
  window.addEventListener(COOKIE_CONSENT_DECIDED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(REOPEN_COOKIE_CONSENT_EVENT, onChange);
    window.removeEventListener(COOKIE_CONSENT_DECIDED_EVENT, onChange);
  };
}

function getSnapshot(): Consent {
  // localStorage can throw (private-browsing storage caps, strict
  // cookie/site-data browser settings, some corporate policies) — treated
  // the same as "no choice yet" rather than left to crash the banner.
  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return stored === "accepted" || stored === "rejected" ? stored : "none";
  } catch {
    return "none";
  }
}

const getServerSnapshot = (): Consent => "unknown";

/** The stored choice, live. Exported because /legal/gestion-cookies reads
 *  the same key and had grown its own copy of this logic, hydration bug
 *  included: two components reading one value in two ways is how they end
 *  up disagreeing. */
export function useCookieConsent(): Consent {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Gates Vercel Analytics/Speed Insights behind an actual decision instead
// of loading them unconditionally (which is what layout.tsx did before —
// simultaneously contradicting /privacy's own claim of using no analytics
// trackers). Both scripts only mount once `consent === "accepted"`; there
// is no third "necessary cookies only, no banner" path here, since
// analytics is the only non-essential thing this site loads.
//
// No separate dismiss or close action: closing without an explicit choice
// must not read as implicit acceptance.
export function CookieConsent() {
  const consent = useCookieConsent();

  function decide(value: "accepted" | "rejected") {
    // Written first, then announced. The event is what makes this component
    // (and /legal/gestion-cookies, which reads the same key) re-read, so the
    // write has to have happened by the time it fires.
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
    } catch {
      // Storage refused the write, which private browsing and some
      // corporate policies do. The banner would then reopen on the next
      // visit; the alternative, keeping it open now, is worse.
    }
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

      {consent === "none" && (
        // Deliberately the plainest thing on this site.
        //
        // The previous version was a glass card built from the site's own
        // recipe and the shared Button component, and it was reported as
        // visible but completely inert: no click, no hover. That could not
        // be reproduced here, because no browser runs on this project, so
        // the fix is not a diagnosis. It is the removal of every candidate.
        //
        // Gone: backdrop-filter, which creates its own stacking context and
        // is the most quirk-prone property in this file's vicinity; and the
        // Button component, which carries a WebGL specular canvas over its
        // own surface. That canvas is pointer-events-none today, but a
        // consent banner is the wrong place to depend on a detail of
        // another component's overlay.
        //
        // What is left between a finger and the handler: one fixed div, one
        // solid panel, two native buttons. If this still fails, the cause is
        // outside this file and the next step is a browser, not more guesses.
        <div
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm"
          // `env(safe-area-inset-bottom)` guards against mobile browsers'
          // own bottom toolbar overlapping (and eating clicks meant for)
          // a plain `bottom-4` fixed element — falls back to 0 on browsers
          // without the safe-area env vars.
          style={{ zIndex: "var(--z-consent)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div
            className="p-6"
            style={{
              borderRadius: 20,
              background: "var(--kov-carbon)",
              border: "1px solid var(--kov-border)",
              boxShadow: "0 24px 60px -20px rgba(0,0,0,0.75)",
            }}
          >
            <p className="text-xs uppercase tracking-widest text-kov-steel mb-3">Cookies</p>
            <p className="text-kov-bone text-sm leading-relaxed mb-6">
              On utilise des cookies de mesure d&apos;audience pour comprendre comment le site est utilisé, uniquement
              avec votre accord.{" "}
              <Link
                href="/legal/cookies"
                className="text-kov-red hover:text-kov-red-signal transition-colors underline underline-offset-2"
              >
                En savoir plus
              </Link>
            </p>
            <div className="flex items-center gap-3">
              {/* Same size, same weight, same prominence for both. CNIL
                  guidance treats an accept/reject pair with unequal visual
                  weight as invalidating the consent itself, so the only
                  difference between these two is the colour. */}
              <button
                type="button"
                onClick={() => decide("accepted")}
                className="flex-1 px-4 py-3 text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-85"
                style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)", border: "1px solid var(--kov-red)" }}
              >
                Accepter
              </button>
              <button
                type="button"
                onClick={() => decide("rejected")}
                className="flex-1 px-4 py-3 text-xs uppercase tracking-widest text-kov-bone transition-colors hover:text-kov-red"
                style={{ background: "transparent", borderRadius: "var(--radius-pill)", border: "1px solid var(--kov-border)" }}
              >
                Refuser
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
