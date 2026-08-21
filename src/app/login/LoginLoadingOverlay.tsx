"use client";

import { createPortal } from "react-dom";

// Shown for the duration of the login Server Action (credentials check +
// role-based redirect) — the same form serves both /admin and /client, so
// this single overlay covers both destinations.
export function LoginLoadingOverlay() {
  return createPortal(
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{ zIndex: "var(--z-modal)", background: "var(--kov-black)" }}
    >
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kov/brand/kov-wordmark-bone.png" alt="KOV" className="h-6 w-auto" />
        <span
          className="text-kov-steel text-xs uppercase tracking-widest border-l pl-3"
          style={{ borderColor: "var(--kov-border)" }}
        >
          Studio
        </span>
      </div>

      <div
        className="w-48 h-[3px] overflow-hidden"
        style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-pill)" }}
      >
        <div
          className="login-loading-bar h-full w-1/3"
          style={{ background: "var(--kov-red)", boxShadow: "0 0 12px 2px var(--kov-red)" }}
        />
      </div>
    </div>,
    document.body
  );
}
