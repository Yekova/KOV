"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BADGE_PATH,
  CLICKS_REQUIRED,
  CLICK_WINDOW_MS,
  markBadgeUnlocked,
  registerLogoClick,
  resetLogoStreak,
} from "@/lib/easterEgg";

// Five clicks on the nav logo open the badge page.
//
// The logo stays a link to the homepage throughout: clicks one to four do
// exactly what a logo is supposed to do, and only the fifth is intercepted.
// Nothing about the normal behaviour is worth trading for a hidden one, and
// a logo that stopped going home while you were "in a streak" would read as
// broken rather than as a secret.
//
// `streak` is returned so the caller can give a faint tell once the visitor
// is clearly on purpose. Without it, someone who clicks three times and
// stops learns nothing, and someone who succeeds cannot tell whether they
// triggered something or broke something.
export function useLogoEasterEgg() {
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const onLogoClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      // Modified clicks belong to the browser, not to us: cmd-click opens
      // the homepage in a new tab and has to keep doing exactly that.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }

      const count = registerLogoClick();

      if (count >= CLICKS_REQUIRED) {
        event.preventDefault();
        markBadgeUnlocked();
        resetLogoStreak();
        setStreak(0);
        router.push(BADGE_PATH);
        return;
      }

      setStreak(count);
      // The stored streak expires on its own timestamp; this only expires
      // the *visual* tell, so the glow fades when someone stops clicking
      // instead of sitting there until the next navigation.
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setStreak(0), CLICK_WINDOW_MS);
    },
    [router]
  );

  return { onLogoClick, streak };
}
