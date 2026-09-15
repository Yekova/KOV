"use client";

// Crash-surviving breadcrumb log for the Studio.
//
// The Lounge failure is a *renderer* crash (the browser's own "reload this
// page" screen), which means console logs, error boundaries and any
// in-page reporting all die with the process — there is nothing left to
// read afterwards. sessionStorage, however, belongs to the tab, not the
// renderer process: it survives the crash and is still there after the
// reload. So every step of the navigation writes a breadcrumb there
// synchronously, and on the next load the previous session's trail is
// rotated aside and shown. The last breadcrumb before the gap is the
// instruction that killed the tab.
//
// Recording is always on; only the panel is gated behind ?diag=1. That
// split matters in practice: a crash can't be planned for, and requiring
// the flag up front meant every crash had to happen twice before it could
// be read. Now the trail is already there, and opening ?diag=1 in the same
// tab afterwards shows the session that died. The cost is a few dozen
// small sessionStorage writes per visit, and nothing at all on screen.

export interface DiagEntry {
  /** ms since this page load. */
  t: number;
  step: string;
  /** JS heap in MB (Chromium only — performance.memory is non-standard). */
  heap?: number;
  /** Live WebGL resources on the main canvas, straight from three's own
   * renderer.info — the decisive signal for "is something leaking GPU
   * memory" as opposed to "one allocation was simply too big". */
  tex?: number;
  geo?: number;
  note?: string;
}

const KEY = "kov-studio-diag";
const PREV_KEY = "kov-studio-diag-prev";
const STICKY_KEY = "kov-studio-diag-on";
// Kept modest: the whole trail is rewritten on every breadcrumb so it can
// survive a crash at any instant, and what matters is always the tail.
const MAX_ENTRIES = 150;

let visible = false;
let initialised = false;
let entries: DiagEntry[] = [];
let startedAt = 0;
let rendererProbe: (() => { tex: number; geo: number }) | null = null;

function safeSession(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    // Private mode / blocked storage — diagnostics simply do nothing.
    return null;
  }
}

/** Whether the on-screen panel should be shown. Recording happens either
 * way — this only controls the display. */
export function isDiagVisible(): boolean {
  if (typeof window === "undefined") return false;
  const store = safeSession();
  const fromUrl = new URLSearchParams(window.location.search).get("diag") === "1";
  // Sticky for the rest of the tab session: the reload after a crash won't
  // carry the query string if the visitor uses the browser's own button.
  if (fromUrl) store?.setItem(STICKY_KEY, "1");
  visible = fromUrl || store?.getItem(STICKY_KEY) === "1";
  return visible;
}

/** Rotates the previous session's trail aside and starts a fresh one. Safe
 * to call more than once; only the first call does anything. */
export function initDiagnostics() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  isDiagVisible();

  const store = safeSession();
  const previous = store?.getItem(KEY);
  if (previous) store?.setItem(PREV_KEY, previous);
  store?.removeItem(KEY);

  startedAt = performance.now();
  entries = [];

  // A plain uncaught error doesn't kill the tab, but it *does* explain a
  // blank screen — worth capturing so the two failure modes can be told
  // apart from the same trail.
  window.addEventListener("error", (e) => diag("window:error", `${e.message} @ ${e.filename}:${e.lineno}`));
  window.addEventListener("unhandledrejection", (e) => diag("window:rejection", String(e.reason)));

  diag("diag:start", `${navigator.userAgent} · ${window.innerWidth}x${window.innerHeight} @dpr${window.devicePixelRatio}`);
}

/** Lets the in-canvas probe expose three's renderer.info to every
 * breadcrumb, without this module importing three or R3F. */
export function registerRendererProbe(fn: (() => { tex: number; geo: number }) | null) {
  rendererProbe = fn;
}

export function diag(step: string, note?: string) {
  if (!initialised) return;
  const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
  const info = rendererProbe?.();
  const entry: DiagEntry = {
    t: Math.round(performance.now() - startedAt),
    step,
    heap: perf.memory ? Math.round(perf.memory.usedJSHeapSize / 1048576) : undefined,
    tex: info?.tex,
    geo: info?.geo,
    note,
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  try {
    // Written on every breadcrumb, not batched: the crash can land on any
    // instruction, and a batched write would lose exactly the last few
    // entries — the only ones that matter.
    safeSession()?.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Quota or blocked storage — keep the in-memory trail regardless.
  }
}

function parse(raw: string | null | undefined): DiagEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DiagEntry[]) : [];
  } catch {
    return [];
  }
}

export function readPreviousSession(): DiagEntry[] {
  return parse(safeSession()?.getItem(PREV_KEY));
}

export function readCurrentSession(): DiagEntry[] {
  return parse(safeSession()?.getItem(KEY));
}

/** Hides the panel for the rest of the tab session and drops what has been
 * collected. Recording itself continues — it costs nothing visible. */
export function clearDiagnostics() {
  const store = safeSession();
  store?.removeItem(KEY);
  store?.removeItem(PREV_KEY);
  store?.removeItem(STICKY_KEY);
  entries = [];
  visible = false;
}

export function formatEntries(list: DiagEntry[]): string {
  return list
    .map((e) => {
      const parts = [`${String(e.t).padStart(6)}ms`, e.step];
      if (e.heap !== undefined) parts.push(`heap ${e.heap}MB`);
      if (e.tex !== undefined) parts.push(`tex ${e.tex}`);
      if (e.geo !== undefined) parts.push(`geo ${e.geo}`);
      if (e.note) parts.push(`— ${e.note}`);
      return parts.join("  ");
    })
    .join("\n");
}
