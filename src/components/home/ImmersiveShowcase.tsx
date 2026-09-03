"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, initGsap, pinAndTrack } from "@/lib/motion";
import { ScrollFloat } from "@/components/ui/ScrollFloat";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { FeatureDemo } from "@/components/home/FeatureDemo";

// Matches --radius-lg — the card's resting corner radius, tweened to 0 as
// it grows so the corners read as flattening the closer they get, the same
// way a rounded rectangle's curvature visually flattens the closer you
// zoom into it.
const RESTING_RADIUS_PX = 12;

// Scroll room (in vh) dedicated to each phase of the runway, past the
// initial 100vh the sticky viewport itself occupies. DIVE_VH is the
// original, already-tuned "zoom until it covers the viewport" pacing —
// preserved exactly, not reflowed, when FADE_VH was added on top of it.
const DIVE_VH = 200;
const FADE_VH = 150;
const RUNWAY_VH = 100 + DIVE_VH + FADE_VH;
const DIVE_SPLIT = DIVE_VH / (DIVE_VH + FADE_VH);

// Second half of the showcase section — same window chrome and ScrollFloat
// text treatment as ScreenShowcase above it, scroll-scrubbed in two beats:
// first the card grows from its resting size until it covers the viewport
// ("diving into" the screen), then — once settled — a live on-brand
// interaction (FeatureDemo) becomes clickable, and continuing to scroll
// fades the whole thing to black, closing the sequence. Pin is CSS
// `position: sticky` on the inner viewport (not GSAP's own ScrollTrigger
// pin) — compositor-only, same pattern as every other pinned scene in this
// codebase; pinAndTrack (`{ pin: false }`) is used purely for its 0→1
// scroll-progress callback.
export function ImmersiveShowcase() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const fadeOverlayRef = useRef<HTMLDivElement>(null);
  const demoWrapperRef = useRef<HTMLDivElement>(null);
  const targetScaleRef = useRef(1);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const runway = runwayRef.current;
    const card = cardRef.current;
    if (!runway || !card) return;
    initGsap();

    function computeTargetScale() {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      // Cover, not contain — the card's own aspect ratio (16:10) rarely
      // matches the viewport's, so scaling by the larger of the two ratios
      // (plus a small overscan margin) guarantees a seamless full-bleed
      // fill; the sticky viewport's own overflow:hidden clips whatever
      // spills past the edges.
      targetScaleRef.current = Math.max(window.innerWidth / rect.width, window.innerHeight / rect.height) * 1.05;
    }

    computeTargetScale();
    window.addEventListener("resize", computeTargetScale);

    const trigger = pinAndTrack(
      runway,
      (progress) => {
        const diveProgress = gsap.utils.clamp(0, 1, progress / DIVE_SPLIT);
        const fadeProgress = gsap.utils.clamp(0, 1, (progress - DIVE_SPLIT) / (1 - DIVE_SPLIT));

        const scale = 1 + (targetScaleRef.current - 1) * diveProgress;
        gsap.set(card, { scale, borderRadius: (1 - diveProgress) * RESTING_RADIUS_PX });

        if (chromeRef.current) {
          // Faded out well before the dive completes (over the first 35%)
          // — left alone, the chrome bar would scale up right along with
          // the card and read as a giant misshapen strip instead of
          // dissolving into the content the way a real "dive in" should.
          gsap.set(chromeRef.current, { opacity: gsap.utils.clamp(0, 1, 1 - diveProgress / 0.35) });
        }

        if (fadeOverlayRef.current) {
          gsap.set(fadeOverlayRef.current, { opacity: fadeProgress });
        }

        // The button only feels clickable once the dive has actually
        // settled and before the fade starts covering it — mid-zoom or
        // mid-fade, a hit would feel premature or land on a vanishing target.
        if (demoWrapperRef.current) {
          demoWrapperRef.current.style.pointerEvents = diveProgress > 0.92 && fadeProgress === 0 ? "auto" : "none";
        }
      },
      { pin: false, end: `+=${DIVE_VH + FADE_VH}%` }
    );

    return () => {
      window.removeEventListener("resize", computeTargetScale);
      trigger.kill();
    };
  }, [reducedMotion]);

  return (
    <section id="showcase-immersive" className="relative">
      <div className="px-6 max-w-[1600px] mx-auto">
        <ScrollFloat
          containerClassName="text-center mb-24 md:mb-36"
          textClassName="font-display text-kov-bone uppercase text-[clamp(28px,4vw,64px)] leading-[var(--line-height-display)]"
          stagger={0.02}
        >
          Un site qui vous ressemble
        </ScrollFloat>
      </div>

      {reducedMotion ? (
        <div className="relative w-full flex items-center justify-center py-24" style={{ background: "var(--kov-carbon)" }}>
          <FeatureDemo />
        </div>
      ) : (
        <div ref={runwayRef} style={{ height: `${RUNWAY_VH}vh` }} className="relative">
          <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center px-6">
            <div
              ref={cardRef}
              className="relative w-full overflow-hidden border"
              style={{
                maxWidth: "1200px",
                borderColor: "var(--kov-border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 40px 90px rgba(0, 0, 0, 0.55)",
                transformOrigin: "50% 50%",
              }}
            >
              <BrowserChrome ref={chromeRef} />
              <div
                className="relative w-full flex items-center justify-center"
                style={{ aspectRatio: "16 / 10", background: "var(--kov-carbon)" }}
              >
                <div ref={demoWrapperRef} style={{ pointerEvents: "none" }}>
                  <FeatureDemo />
                </div>
              </div>
            </div>

            <div
              ref={fadeOverlayRef}
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ background: "var(--kov-black)", opacity: 0, zIndex: 1 }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
