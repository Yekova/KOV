"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { KovCTA } from "@/components/ui/KovCTA";
import { Button } from "@/components/ui/Button";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import { gsap, initGsap, pinAndTrack } from "@/lib/motion";

const GLASS_PILL_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
} as const;

// A cinematic clip generated for this Hero specifically to be scrubbed by
// scroll position rather than played back in real time — the subject sits
// right-of-frame with negative space on the left throughout most of the
// clip, which is what the text column below is built to sit inside.
const VIDEO_SRC = "/kov/home/hero-cinematic.mp4";
const POSTER_SRC = "/kov/home/hero-cinematic-poster.jpg";

// 100vh sticky viewport + 160vh of scroll runway — same "+=160%" scroll
// budget PhilosophyStatement.tsx already spends on its one pinned scene, so
// this doesn't invent a new "how long is a deliberate cinematic beat on this
// site" number.
const SCRUB_HEIGHT_VH = 260;
const SCRUB_END = "+=160%";

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

const HERO_FACTS = [
  { value: "6", label: "Disciplines intégrées" },
  { value: "1", label: "Interlocuteur unique" },
  { value: "100%", label: "Code de production" },
];

// Darkest over the text column (left), fading toward transparent on the
// right where the footage's own subject sits — legibility without washing
// out the video itself.
const LEFT_WEIGHTED_GRADIENT =
  "linear-gradient(90deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.55) 38%, rgba(10,10,10,0.1) 58%, rgba(10,10,10,0.05) 100%)";

// Shared by both render branches (scrubbed + static) so the eyebrow/h1/
// subhead/CTAs/bullets/facts JSX isn't duplicated between them. Left-aligned
// (not centered) to sit in the video's own negative space on the left of
// frame; `innerRef` is only used by the scrubbed branch, to drive the
// scroll-tied fade in HeroScene's own effect below.
function HeroContent({ innerRef }: { innerRef?: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={innerRef} className="max-w-lg md:max-w-[46%]">
      <Reveal variant="fade">
        <span
          className="inline-flex items-center px-4 py-2 border text-xs uppercase tracking-widest text-kov-bone"
          style={{ ...GLASS_PILL_STYLE, borderRadius: "var(--radius-pill)" }}
        >
          Studio digital — Bordeaux, France
        </span>
      </Reveal>

      <Reveal variant="blur" delay={0.15}>
        <h1
          className="mt-8 font-display text-kov-bone uppercase"
          style={{ fontSize: "clamp(32px, 6vw, 100px)", lineHeight: "var(--line-height-display)" }}
        >
          DES SITES WEB
          <br />
          QUI TIENNENT<span className="text-kov-red">.</span>
        </h1>
      </Reveal>

      <Reveal variant="fade" delay={0.3}>
        <p className="mt-8 text-kov-concrete text-sm leading-relaxed">
          Design, développement et motion pensés comme un seul système —
          pas trois prestataires qui se renvoient la responsabilité.
        </p>
      </Reveal>

      <Reveal variant="fade" delay={0.45}>
        <div className="flex flex-wrap items-center gap-4 mt-10">
          <KovCTA href="/contact">Démarrer un projet</KovCTA>
          <Button href="/#work-gallery" variant="pill">
            Voir nos projets
          </Button>
        </div>
      </Reveal>

      <Reveal variant="fade" delay={0.55}>
        <div className="flex flex-col gap-2 mt-8 text-kov-steel text-[11px] uppercase tracking-widest">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red shrink-0" />
            Sur-mesure, pas de template
          </span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red shrink-0" />
            Code de production, pas de maquette
          </span>
        </div>
      </Reveal>

      <Reveal variant="fade" delay={0.65}>
        <div className="mt-10 flex flex-col gap-4 border-t pt-6" style={{ borderColor: "var(--kov-border)" }}>
          {HERO_FACTS.map((fact) => (
            <div key={fact.label} className="flex items-baseline justify-between gap-4">
              <p className="font-display text-kov-bone text-xl">{fact.value}</p>
              <p className="text-kov-steel text-[11px] uppercase tracking-widest text-right">{fact.label}</p>
            </div>
          ))}
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
    // "+=160%" resolve correctly (PhilosophyStatement.tsx's own precedent),
    // CSS sticky is compositor-only (no per-frame re-measurement, more
    // robust on mobile Safari's dynamic viewport height — moot here since
    // mobile gets the static branch, but true if that ever changes), and
    // critically it never mutates the outer section that Nav's
    // absolute→fixed hack depends on, so there's zero risk of the two
    // mechanisms fighting.
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

        {/* Nav/menu button live inside the h-screen sticky box, not as
            direct children of the outer 260vh section: Nav's own "contained"
            variant anchors via `top-*`/`bottom-*` against its nearest
            positioned ancestor (see Nav.tsx, GlobalMenuButton.tsx). Anchored
            to the tall 260vh section, GlobalMenuButton's `bottom-4` would
            sit near the bottom of the whole scroll runway — off-screen,
            ~2.5 viewports down — instead of the bottom of the visible
            viewport. `position: sticky` still makes this div a positioned
            ancestor, so anchoring here keeps both exactly where they were
            before this rework. */}
        <Nav variant="contained" />

        <div
          className="relative h-full flex flex-col justify-center px-6 md:px-16"
          style={{ zIndex: "var(--z-content)" }}
        >
          <HeroContent innerRef={textRef} />
        </div>

        <HeroGlobalMenuButton />
      </div>
    </section>
  );
}
