import { forwardRef } from "react";

// macOS-style traffic lights — a deliberate, scoped exception to this site's
// usual anti-generic-SaaS restraint (confirmed with the user directly), not
// a pattern to reuse elsewhere. Dimmed via opacity rather than full-saturation
// so it still reads as KOV's own dark/quiet palette, not a loud UI chrome.
const TRAFFIC_LIGHTS = ["#ff5f57", "#febc2e", "#28c840"];

// Forwards its ref so callers that scroll-scrub the chrome's own opacity
// (fading it out as the window zooms past it) can target it directly.
interface BrowserChromeProps {
  className?: string;
  /** false: no fake address-bar pill — for windows that are their own
   * digital environment (ActivationWindow), not a mock browser. Default
   * true preserves ScreenShowcase's existing look untouched. */
  showUrlBar?: boolean;
  /** Text for the address pill. Omitted, the pill stays blank — which is
   * what ScreenShowcase has always rendered, and the only honest thing to
   * put there for a project whose URL is not public. Never invent one: a
   * plausible-looking domain in a browser frame is a claim. */
  url?: string | null;
  /** "light": for a chrome sitting on an off-white card rather than on the
   * page's own black. Default "dark" leaves every existing caller alone. */
  tone?: "dark" | "light";
}

export const BrowserChrome = forwardRef<HTMLDivElement, BrowserChromeProps>(function BrowserChrome(
  { className = "", showUrlBar = true, url = null, tone = "dark" },
  ref
) {
  const light = tone === "light";
  return (
    <div
      ref={ref}
      className={`grid grid-cols-3 items-center px-4 py-3 ${className}`}
      style={{
        background: light ? "#e9e7e2" : "var(--kov-graphite)",
        borderBottom: `1px solid ${light ? "rgba(17,18,23,0.10)" : "var(--kov-border)"}`,
      }}
    >
      <div className="flex items-center gap-2" aria-hidden="true">
        {TRAFFIC_LIGHTS.map((color) => (
          <span key={color} className="w-3 h-3 rounded-full" style={{ background: color, opacity: 0.8 }} />
        ))}
      </div>
      {showUrlBar ? (
        <div
          aria-hidden="true"
          className={`h-5 mx-auto min-w-24 flex items-center justify-center px-3 ${url ? "w-full max-w-[280px]" : "w-1/3"}`}
          style={{
            background: light ? "rgba(17,18,23,0.07)" : "var(--kov-carbon)",
            borderRadius: "var(--radius-pill)",
          }}
        >
          {url && (
            <span
              className="truncate"
              style={{
                fontSize: 10,
                letterSpacing: "0.03em",
                color: light ? "rgba(17,18,23,0.5)" : "var(--kov-steel)",
              }}
            >
              {url}
            </span>
          )}
        </div>
      ) : (
        <div />
      )}
      <div />
    </div>
  );
});
