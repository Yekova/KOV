// The whole easter egg in one file: how many clicks, how fast, where they
// lead, and where the unlock is remembered.
//
// The streak has to survive a component unmount. Nav is rendered by
// SiteChrome on every page except the homepage, where HeroScene renders its
// own contained copy instead — so clicking the logo from /journal swaps one
// Nav for another mid-streak, and React state would reset to zero exactly
// when the visitor is doing the right thing. sessionStorage does not.
//
// Every access is guarded. Storage throws outright in Safari's private mode
// and in any browser set to block site data, and a throw here would land in
// the navigation bar of every page on the site. A failure degrades to "not
// unlocked", never to a crash.

/** The reward page. Nothing links to it. */
export const BADGE_PATH = "/badge";

/** Clicks on the nav logo that open it. */
export const CLICKS_REQUIRED = 5;

/** A click this long after the previous one starts a new streak instead of
 *  continuing it. Long enough to be comfortable, short enough that five
 *  ordinary visits to the homepage over a session never add up to an
 *  accidental unlock. */
export const CLICK_WINDOW_MS = 1200;

/** The discount code. One string, one place to change it to reissue. */
export const BADGE_CODE = "KOV-BADGE-10";

const UNLOCK_KEY = "kov.badge.unlocked";
const STREAK_KEY = "kov.badge.streak";

function readStore(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Has this browser found the badge? localStorage, not session: finding it
 *  once should not have to be done again next week. */
export function isBadgeUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return readStore("local")?.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function markBadgeUnlocked(): void {
  try {
    readStore("local")?.setItem(UNLOCK_KEY, "1");
  } catch {
    // Unlocking is a nicety, not a transaction. A visitor who blocks storage
    // still gets the page they just earned — they just get asked to earn it
    // again next time.
  }
}

/** Records a click on the logo and returns how long the current streak is,
 *  this click included. */
export function registerLogoClick(): number {
  const store = readStore("session");
  if (!store) return 1;

  const now = Date.now();
  let streak = 0;

  try {
    const raw = store.getItem(STREAK_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      // Anything else in this key — a stale shape, another tab's mess, a
      // hand-edited value — is treated as no streak rather than trusted.
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof (parsed as { n?: unknown }).n === "number" &&
        typeof (parsed as { t?: unknown }).t === "number" &&
        now - (parsed as { t: number }).t <= CLICK_WINDOW_MS
      ) {
        streak = (parsed as { n: number }).n;
      }
    }
  } catch {
    streak = 0;
  }

  const next = streak + 1;
  try {
    store.setItem(STREAK_KEY, JSON.stringify({ n: next, t: now }));
  } catch {
    // Without storage every click reads as the first, so the egg simply
    // never hatches. That is the correct failure: silent, and harmless.
  }
  return next;
}

export function resetLogoStreak(): void {
  try {
    readStore("session")?.removeItem(STREAK_KEY);
  } catch {
    // Nothing to clean up if there was nowhere to write in the first place.
  }
}
