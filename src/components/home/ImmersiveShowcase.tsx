"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap, initGsap, pinAndTrack } from "@/lib/motion";
import { ScrollFloat } from "@/components/ui/ScrollFloat";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { useLightZone } from "@/hooks/useLightZone";

interface ImmersiveShowcaseProps {
  /** Not supplied yet — renders the same honest placeholder as
   * ScreenShowcase until a second, distinct site preview exists. */
  screenshotSrc?: string;
}

// Matches --radius-lg — the card's resting corner radius, tweened to 0 as
// it grows so the corners read as flattening the closer they get, the same
// way a rounded rectangle's curvature visually flattens the closer you
// zoom into it.
const RESTING_RADIUS_PX = 12;

// Second half of the showcase section — same window chrome and ScrollFloat
// text treatment as ScreenShowcase above it, but scroll-scrubbed to zoom
// past the frame entirely: the card grows from its resting card size until
// it covers the viewport, "diving into" the screen instead of just
// revealing it. Pin is CSS `position: sticky` on the inner viewport (not
// GSAP's own ScrollTrigger pin) — compositor-only, same pattern as every
// other pinned scene in this codebase; pinAndTrack (`{ pin: false }`) is
// used purely for its 0→1 scroll-progress callback.
export function ImmersiveShowcase({ screenshotSrc }: ImmersiveShowcaseProps) {
  const runwayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const targetScaleRef = useRef(1);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Same light-zone registration as ScreenShowcase — only meaningful once a
  // real (light) screenshot replaces the placeholder here.
  useLightZone(screenRef, Boolean(screenshotSrc));

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
        const scale = 1 + (targetScaleRef.current - 1) * progress;
        gsap.set(card, { scale, borderRadius: (1 - progress) * RESTING_RADIUS_PX });
        if (chromeRef.current) {
          // Faded out well before the dive completes (over the first 35%)
          // — left alone, the chrome bar would scale up right along with
          // the card and read as a giant misshapen strip instead of
          // dissolving into the content the way a real "dive in" should.
          gsap.set(chromeRef.current, { opacity: gsap.utils.clamp(0, 1, 1 - progress / 0.35) });
        }
      },
      { pin: false, end: "+=200%" }
    );

    return () => {
      window.removeEventListener("resize", computeTargetScale);
      trigger.kill();
    };
  }, [reducedMotion]);

  const screen = screenshotSrc ? (
    <Image src={screenshotSrc} alt="Aperçu d'un site conçu par KOV, sur-mesure" fill sizes="100vw" className="object-cover" />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="text-kov-steel text-xs uppercase tracking-widest">Aperçu du site à venir</p>
    </div>
  );

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
        <div className="relative w-full" style={{ aspectRatio: "16 / 10", background: "var(--kov-carbon)" }}>
          <div ref={screenRef} className="absolute inset-0">
            {screen}
          </div>
        </div>
      ) : (
        <div ref={runwayRef} style={{ height: "300vh" }} className="relative">
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
              <div ref={screenRef} className="relative w-full" style={{ aspectRatio: "16 / 10", background: "var(--kov-carbon)" }}>
                {screen}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
