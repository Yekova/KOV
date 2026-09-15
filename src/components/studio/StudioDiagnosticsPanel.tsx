"use client";

import { useState } from "react";
import {
  isDiagVisible,
  readPreviousSession,
  readCurrentSession,
  clearDiagnostics,
  formatEntries,
  type DiagEntry,
} from "@/lib/studioDiagnostics";

// Only ever rendered when ?diag=1 has been used in this tab — though the
// trail is recorded either way, so opening ?diag=1 *after* a crash still
// shows the session that died. It sits above the live one, because its
// last line is the answer.
export function StudioDiagnosticsPanel() {
  const [visible, setVisible] = useState(true);
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isDiagVisible()) return null;

  const previous: DiagEntry[] = readPreviousSession();
  const current: DiagEntry[] = readCurrentSession();
  const report =
    (previous.length ? `=== SESSION PRÉCÉDENTE (crash) ===\n${formatEntries(previous)}\n\n` : "") +
    `=== SESSION ACTUELLE ===\n${formatEntries(current)}`;

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="fixed bottom-4 left-4 px-3 py-1.5 text-[10px] uppercase tracking-widest text-kov-white"
        style={{ zIndex: 2147483647, borderRadius: 6, background: "var(--kov-red)" }}
      >
        Diag
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 left-4 flex flex-col"
      style={{
        zIndex: 2147483647,
        width: "min(560px, calc(100vw - 2rem))",
        maxHeight: "min(70vh, 520px)",
        borderRadius: 10,
        background: "rgba(6,6,7,0.96)",
        border: "1px solid var(--kov-red)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <p className="text-kov-bone text-[10px] uppercase tracking-widest">
          Studio diag · {previous.length ? `${previous.length} + ` : ""}
          {current.length} étapes
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(report).then(
                () => setCopied(true),
                () => setCopied(false)
              );
            }}
            className="px-2 py-1 text-[9px] uppercase tracking-widest text-kov-white"
            style={{ borderRadius: 5, background: "var(--kov-red)" }}
          >
            {copied ? "Copié" : "Copier"}
          </button>
          <button
            type="button"
            onClick={() => setTick((t) => t + 1)}
            className="px-2 py-1 text-[9px] uppercase tracking-widest text-kov-bone"
            style={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.15)" }}
          >
            ↻
          </button>
          <button
            type="button"
            onClick={() => {
              clearDiagnostics();
              setVisible(false);
            }}
            className="px-2 py-1 text-[9px] uppercase tracking-widest text-kov-steel"
            style={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.15)" }}
          >
            Stop
          </button>
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Réduire"
            className="px-2 py-1 text-[9px] text-kov-steel"
          >
            ×
          </button>
        </div>
      </div>
      <pre
        key={tick}
        className="flex-1 overflow-auto px-3 py-2 text-kov-bone"
        style={{ fontSize: 10, lineHeight: 1.45, whiteSpace: "pre", fontFamily: "var(--font-mono, monospace)", margin: 0 }}
      >
        {report}
      </pre>
    </div>
  );
}
