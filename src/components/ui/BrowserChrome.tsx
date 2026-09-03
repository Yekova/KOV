import { forwardRef } from "react";

// macOS-style traffic lights — a deliberate, scoped exception to this site's
// usual anti-generic-SaaS restraint (confirmed with the user directly), not
// a pattern to reuse elsewhere. Dimmed via opacity rather than full-saturation
// so it still reads as KOV's own dark/quiet palette, not a loud UI chrome.
const TRAFFIC_LIGHTS = ["#ff5f57", "#febc2e", "#28c840"];

// Extracted from ScreenShowcase so the immersive "dive in" showcase
// (ImmersiveShowcase.tsx) renders the exact same window chrome rather than
// a second hand-copied version drifting out of sync. Forwards its ref so
// callers that scroll-scrub the chrome's own opacity (fading it out as the
// window zooms past it) can target it directly.
export const BrowserChrome = forwardRef<HTMLDivElement, { className?: string }>(function BrowserChrome(
  { className = "" },
  ref
) {
  return (
    <div
      ref={ref}
      className={`grid grid-cols-3 items-center px-4 py-3 ${className}`}
      style={{ background: "var(--kov-graphite)", borderBottom: "1px solid var(--kov-border)" }}
    >
      <div className="flex items-center gap-2" aria-hidden="true">
        {TRAFFIC_LIGHTS.map((color) => (
          <span key={color} className="w-3 h-3 rounded-full" style={{ background: color, opacity: 0.8 }} />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="h-5 mx-auto w-1/3 min-w-24"
        style={{ background: "var(--kov-carbon)", borderRadius: "var(--radius-pill)" }}
      />
      <div />
    </div>
  );
});
