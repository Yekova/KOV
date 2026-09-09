interface MediaProps {
  reducedMotion: boolean;
  /** Real photo path, supplied per-card once the user provides one. Falls
   * back to the honest "Photo à venir" placeholder when absent — matches
   * the convention already used elsewhere (ScreenShowcase, KovProjectCard)
   * rather than a stock photo standing in for a real one. */
  src?: string;
}

export function PhotoPlaceholder({ src }: MediaProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- these live inside a scroll-driven coverflow whose size/visibility is driven by imperative transforms every frame; next/image's lazy-load lifecycle fights that pattern, same reasoning as MouseFrameBackdrop.tsx.
    return <img src={src} alt="" className="w-full h-full object-cover" />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex flex-col items-center gap-2 text-kov-steel">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M21 16l-5-5-4 4-3-3-4 4" />
        </svg>
        <span className="text-[10px] uppercase tracking-widest">Photo à venir</span>
      </div>
    </div>
  );
}

// User-supplied device-mockup footage for the Responsive card. Under
// reducedMotion, skip <video>/autoplay entirely and show the poster frame
// as a plain image instead — simpler than reasoning about whether a
// non-autoplaying <video> reliably paints its poster across browsers.
export function ResponsiveMedia({ reducedMotion }: MediaProps) {
  if (reducedMotion) {
    // eslint-disable-next-line @next/next/no-img-element -- imperative-free static fallback, not worth next/image's overhead for a single small poster
    return <img src="/home/responsive-mockup-poster.jpg" alt="" className="w-full h-full object-cover" />;
  }
  return (
    <video
      className="w-full h-full object-cover"
      src="/home/responsive-mockup.mp4"
      poster="/home/responsive-mockup-poster.jpg"
      autoPlay
      loop
      muted
      playsInline
      aria-hidden="true"
    />
  );
}
