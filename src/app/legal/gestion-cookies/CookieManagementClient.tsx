"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  REOPEN_COOKIE_CONSENT_EVENT,
  useCookieConsent,
} from "@/components/layout/CookieConsent";

const STATUS_LABEL: Record<"accepted" | "rejected" | "none", string> = {
  accepted: "Cookies de mesure d'audience acceptés",
  rejected: "Cookies de mesure d'audience refusés",
  none: "Aucun choix enregistré pour l'instant",
};

// A real settings page, not a duplicate of /legal/cookies' policy text —
// reads the actual stored choice and can clear it, which re-triggers the
// same banner CookieConsent.tsx shows on a first visit (via a window
// event; see that file's own note on why an event and not a shared
// context). This is a client page specifically because reading
// localStorage and reacting to consent changes only makes sense in the
// browser.
export function CookieManagementClient() {
  // One shared reader, so this page and the banner cannot disagree about
  // what the visitor chose. It also listens for the decision event itself,
  // which is what keeps this readout from staying frozen on "aucun choix"
  // after someone decides in the banner without reloading.
  const consent = useCookieConsent();

  function handleReset() {
    try {
      window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    } catch {
      // Same storage-can-throw guard as CookieConsent.tsx. The event below
      // still fires, so the banner reopens either way.
    }
    window.dispatchEvent(new Event(REOPEN_COOKIE_CONSENT_EVENT));
  }

  // "unknown" only lasts until hydration resolves; showing "aucun choix"
  // for that instant is the honest default.
  const statusKey = consent === "accepted" || consent === "rejected" ? consent : "none";

  return (
    <div
      className="p-8 md:p-12"
      style={{
        borderRadius: 24,
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
      <p className="font-mono text-xs text-kov-red flex items-center gap-3">
        06
        <span aria-hidden="true" className="w-6 h-px" style={{ background: "var(--kov-red)" }} />
      </p>
      <h1
        className="mt-5 font-display text-kov-bone uppercase"
        style={{ fontSize: "clamp(26px, 2.6vw, 40px)", lineHeight: "var(--line-height-display)" }}
      >
        Gestion des cookies
      </h1>
      <p className="mt-4 max-w-2xl text-kov-steel text-sm leading-relaxed">
        Votre choix concernant les cookies de mesure d&apos;audience, et un moyen d&apos;en changer à tout moment —
        voir la{" "}
        <Link href="/legal/cookies" className="text-kov-red hover:underline">
          politique de cookies
        </Link>{" "}
        pour le détail de ce qui est mesuré.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-6 sm:justify-between p-6" style={{ borderRadius: 16, border: "1px solid var(--glass-border)" }}>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: consent === "accepted" ? "var(--kov-red)" : "var(--kov-steel)" }}
          />
          <p className="text-kov-bone text-sm">{STATUS_LABEL[statusKey]}</p>
        </div>
        <Button type="button" variant="secondary" onClick={handleReset}>
          Modifier mon choix
        </Button>
      </div>
    </div>
  );
}
