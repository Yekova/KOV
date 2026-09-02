"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { KovCTA } from "@/components/ui/KovCTA";
import { Button } from "@/components/ui/Button";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import { gsap, initGsap, pinAndTrack } from "@/lib/motion";

// A cinematic clip generated for this Hero specifically to be scrubbed by
// scroll position rather than played back in real time — the subject sits
// right-of-frame with negative space on the left through most of the clip,
// which is what the text column below is built to sit inside.
const VIDEO_SRC = "/kov/home/hero-cinematic.mp4";
const POSTER_SRC = "/kov/home/hero-cinematic-poster.jpg";

// 100vh sticky viewport + 300vh of scroll runway. First pass used 160vh
// (PhilosophyStatement's own budget) but the clip's 145 frames blew past in
// too little scroll distance to read as a turn — tripling the runway gives
// each frame roughly 2x the scroll-pixels, a clearly perceptible slowdown.
// Tunable if it still needs adjusting once seen live.
const SCRUB_HEIGHT_VH = 400;
const SCRUB_END = "+=300%";

// The back half of the scrub should read as a clean, uninterrupted visual
// moment — text dissolves out over this scroll-progress window rather than
// sitting glued on screen for the whole scrub.
const TEXT_FADE_START = 0.4;
const TEXT_FADE_END = 0.55;

// Matches the sitewide `md:` (768px) breakpoint. Below it, GSAP pin/scroll
// math and video-seek cost are both real jank risks, and the footage was
// calibrated for arbitrary scroll pacing (not a fixed frame rate), so an
// ambient autoplay loop risks looking uncalibrated — a static poster is
// simpler and safer, same fallback tier as reduced-motion.
const MOBILE_QUERY = "(max-width: 767px)";

// Darkest over the text column (left), fading toward transparent on the
// right where the footage's own subject sits — legibility without washing
// out the video itself.
const LEFT_WEIGHTED_GRADIENT =
  "linear-gradient(90deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.55) 38%, rgba(10,10,10,0.1) 58%, rgba(10,10,10,0.05) 100%)";

// Shared by both render branches (scrubbed + static) so the h1/subhead/CTAs
// JSX isn't duplicated between them. Left-aligned (not centered) to sit in
// the video's own negative space on the left of frame. Deliberately just
// three elements — headline, subhead, two CTAs, nothing else (no eyebrow
// badge, no bullet tags, no stats row) — matching a reference the user
// wants this text block to plainly look like. `innerRef` is only used by
// the scrubbed branch, to drive the scroll-tied fade in HeroScene's own
// effect below.
function HeroContent({ innerRef }: { innerRef?: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={innerRef} className="max-w-lg md:max-w-[46%]">
      <Reveal variant="blur">
        <h1
          className="font-display text-kov-bone uppercase"
          style={{ fontSize: "clamp(32px, 6vw, 100px)", lineHeight: "var(--line-height-display)" }}
        >
          DES SITES WEB
          <br />
          QUI TIENNENT<span className="text-kov-red">.</span>
        </h1>
      </Reveal>

      <Reveal variant="fade" delay={0.15}>
        <p className="mt-8 text-kov-concrete text-sm leading-relaxed">
          Design, développement et motion pensés comme un seul système —
          pas trois prestataires qui se renvoient la responsabilité.
        </p>
      </Reveal>

      <Reveal variant="fade" delay={0.3}>
        <div className="flex flex-wrap items-center gap-4 mt-10">
          <KovCTA href="/contact">Démarrer un projet</KovCTA>
          <Button href="/#work-gallery" variant="pill">
            Voir nos projets
          </Button>
        </div>
      </Reveal>
    </div>
  );
}

// Reduced-motion AND narrow-viewport fallback — not just unanimated, the
// scrubbed DOM shape (tall section, sticky video, pin tracking) doesn't
// mount at all, matching every other scroll-driven scene's convention on
// this site (see PhilosophyStatement.tsx). A single viewport tall, the
// poster frame as a plain background image — same composition as the video
// (it's a still from the same clip), so the left-aligned text column still
// makes sense here even with no video playing.
function StaticHero() {
  return (
    <section id="hero" className="relative min-h-screen overflow-hidden" style={{ background: "var(--kov-black)" }}>
      <Image src={POSTER_SRC} alt="" aria-hidden="true" fill priority sizes="100vw" className="object-cover" />

      <div className="absolute inset-0" style={{ zIndex: "var(--z-atmosphere)", background: LEFT_WEIGHTED_GRADIENT }} />

      <Nav variant="contained" />

      <div
        className="relative min-h-screen flex flex-col justify-center px-6 md:px-16"
        style={{ zIndex: "var(--z-content)" }}
      >
        <HeroContent />
      </div>

      <HeroGlobalMenuButton />
    </section>
  );
}

export function HeroScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [isNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches);
  const useStaticHero = reducedMotion || isNarrow;

  useEffect(() => {
    if (useStaticHero) return;
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const video = videoRef.current;
    const text = textRef.current;
    if (!section || !sticky || !video || !text) return;
    initGsap();

    let duration = 0;
    let latestProgress = 0;
    let rafId: number | null = null;

    function readDuration() {
      duration = video!.duration || 0;
    }
    video.addEventListener("loadedmetadata", readDuration);
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) readDuration();

    function applyFrame() {
      rafId = null;
      // Guards the file not existing/loading yet: loadedmetadata never
      // fires, duration stays 0, this just no-ops instead of writing
      // NaN/undefined into currentTime.
      if (duration && Number.isFinite(duration)) {
        video!.currentTime = latestProgress * duration;
      }

      const fade = gsap.utils.clamp(0, 1, gsap.utils.mapRange(TEXT_FADE_START, TEXT_FADE_END, 1, 0, latestProgress));
      gsap.set(text, { opacity: fade, y: (1 - fade) * -32 });
    }

    // pinAndTrack is reused for its progress-tracking only (`pin: false`) —
    // the actual pinning is CSS `position: sticky` on `stickyRef` (see JSX
    // below), not GSAP's `pin: true`. Reasoning: `pin:true` would still need
    // this same inner-100vh-trigger/outer-tall-wrapper split to make
    // "+=300%" resolve correctly (PhilosophyStatement.tsx's own precedent),
    // CSS sticky is compositor-only, and critically it never mutates the
    // outer section that Nav's absolute→fixed hack depends on.
    const ctx = gsap.context(() => {
      pinAndTrack(
        sticky,
        (progress) => {
          latestProgress = progress;
          if (rafId === null) rafId = requestAnimationFrame(applyFrame);
        },
        { end: SCRUB_END, pin: false }
      );
    }, section);

    return () => {
      ctx.revert();
      video.removeEventListener("loadedmetadata", readDuration);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [useStaticHero]);

  if (useStaticHero) {
    return <StaticHero />;
  }

  return (
    <section id="hero" ref={sectionRef} className="relative" style={{ height: `${SCRUB_HEIGHT_VH}vh` }}>
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen overflow-hidden"
        style={{ background: "var(--kov-black)" }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          preload="metadata"
          poster={POSTER_SRC}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: "var(--z-canvas)" }}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>

        <div className="absolute inset-0" style={{ zIndex: "var(--z-atmosphere)", background: LEFT_WEIGHTED_GRADIENT }} />

        <div
          className="relative h-full flex flex-col justify-center px-6 md:px-16"
          style={{ zIndex: "var(--z-content)" }}
        >
          <HeroContent innerRef={textRef} />
        </div>
      </div>

      {/* Nav stays a direct child of this OUTER section, exactly like
          before this rework — `top-4` resolves the same regardless of how
          tall the ancestor is, so it doesn't need any special handling.
          `position: sticky` (on `stickyRef` above) unconditionally creates
          its own stacking context, even with no explicit z-index — nesting
          Nav/the menu button inside it would trap their z-nav(50) so it
          only competes *within* that local context, never against
          GradualBlur's page-wide top blur (z-glass=40) which lives outside
          HeroScene entirely: GradualBlur would then paint over both,
          regardless of their own z-index, because the whole sticky box
          (auto z-index) sits in a lower paint layer than GradualBlur's
          explicit one. Keeping them outside `stickyRef` avoids that trap. */}
      <Nav variant="contained" />

      {/* HeroGlobalMenuButton's own `bottom-4` needs a 100vh containing
          block to land at the bottom of the visible viewport — anchored
          directly to this whole section (400vh) it would sit ~3 viewports
          below the fold instead. This wrapper is `position: absolute` with
          no z-index (auto), so — unlike a sticky/fixed wrapper — it does
          NOT create a stacking context of its own, and the button's own
          inline z-nav(50) still bubbles straight up to compete directly
          against GradualBlur, same reasoning as the Nav comment above. */}
      <div className="absolute inset-x-0 top-0 h-screen pointer-events-none">
        <div className="pointer-events-auto">
          <HeroGlobalMenuButton />
        </div>
      </div>
    </section>
  );
}
