"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { gsap, pinAndTrack } from "@/lib/motion";

const FEATURES = [
  "Visite interactive à 360°, navigable à la souris ou au doigt",
  "Aucune app à installer — un lien, ouvert dans n'importe quel navigateur",
  "Hébergée sur votre site ou sur le nôtre, selon votre projet",
];

// Extra scroll distance (vh) for the desktop pinned runway — the video
// scrubs across the first VIDEO_SPLIT share of it, then holds on the last
// frame while the outro (black + KOV mark + spark) fades in over the rest.
const RUNWAY_VH = 180;
const VIDEO_SPLIT = 0.85;

const LEFT_COLUMN = (
  <>
    <p className="text-xs uppercase tracking-widest text-kov-steel">Studio virtuel</p>
    <h2
      className="mt-4 font-display text-kov-bone uppercase"
      style={{ fontSize: "clamp(28px, 3.6vw, 52px)", lineHeight: "var(--line-height-display)" }}
    >
      Vos espaces,
      <br />
      en <span className="text-kov-red">360°</span>.
    </h2>
    <p className="mt-6 text-kov-steel text-sm leading-relaxed max-w-md">
      On construit le même type d&apos;expérience immersive que celle-ci pour vos propres espaces : un lieu réel,
      capturé en 360° et transformé en visite interactive, navigable et mémorable — pour une agence, une boutique,
      un bien à visiter à distance.
    </p>

    <ul className="mt-8 space-y-3 max-w-md">
      {FEATURES.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-kov-concrete text-sm leading-relaxed">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-kov-red" />
          {feature}
        </li>
      ))}
    </ul>

    <div className="mt-8 flex flex-col items-start gap-3">
      <Button variant="primary" href="/studio">
        Explorer le studio →
      </Button>
      <Button variant="secondary" href="/contact">
        Discuter d&apos;un projet
      </Button>
    </div>
  </>
);

// The right-side card's own overlay chrome (badge + caption) fades out as
// the outro fades in — a red 4-point sparkle (Lucide's own "sparkle" path),
// not the removed watermark's shape reused by coincidence: same familiar
// glyph, deliberate here instead of stamped by someone else's tool.
function VideoChrome({
  chromeRef,
  outroRef,
}: {
  chromeRef: RefObject<HTMLDivElement | null>;
  outroRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <div ref={chromeRef}>
        <div
          className="absolute top-5 left-5 flex items-center gap-2 px-3 py-1.5"
          style={{
            borderRadius: "var(--radius-pill)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
          <span className="text-kov-bone text-[10px] uppercase tracking-widest">Visite 360°</span>
        </div>

        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
          <p className="text-kov-bone text-xs uppercase tracking-widest">Le Portal — Entrée du studio</p>
          <span
            aria-hidden="true"
            className="text-kov-bone text-xs uppercase tracking-widest inline-flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1"
          >
            Visiter →
          </span>
        </div>
      </div>

      <div
        ref={outroRef}
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
        style={{ background: "var(--kov-black)", opacity: 0 }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--kov-red)" style={{ filter: "drop-shadow(0 0 12px rgba(227,30,36,0.65))" }}>
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
        <p className="font-display text-kov-bone uppercase tracking-widest text-sm">KOV</p>
        <p className="text-kov-steel uppercase tracking-widest text-[10px]">Virtual Studio</p>
      </div>
    </>
  );
}

// Right after Expertise — the KOV Virtual Studio (src/app/studio) is real,
// already built and live, not a mockup: this section pitches it as a
// service (immersive 360° tours of a real physical space), scrubbing a
// real cinematic pass through the Portal room frame-by-frame as you
// scroll rather than a static screenshot. Encoded all-keyframe
// (public/home/studio-showreel.mp4) specifically so arbitrary seeks land
// on an exact frame instead of decoding forward from the last one — the
// difference between this reading as "frame-accurate" vs. laggy.
export function StudioShowcase() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const runway = runwayRef.current;
    const video = videoRef.current;
    if (!runway || !video) return;

    const trigger = pinAndTrack(
      runway,
      (progress) => {
        if (!Number.isNaN(video.duration)) {
          const videoT = gsap.utils.clamp(0, 1, progress / VIDEO_SPLIT);
          video.currentTime = videoT * video.duration;
        }
        const outroT = gsap.utils.clamp(0, 1, (progress - VIDEO_SPLIT) / (1 - VIDEO_SPLIT));
        if (outroRef.current) outroRef.current.style.opacity = String(outroT);
        if (chromeRef.current) chromeRef.current.style.opacity = String(1 - outroT);
      },
      { pin: false, end: `+=${RUNWAY_VH}%` }
    );

    return () => trigger.kill();
  }, [reducedMotion]);

  return (
    <section id="studio-showcase" className="relative">
      {/* Desktop — pinned runway, video scrubbed by scroll. */}
      <div
        ref={runwayRef}
        className="relative hidden md:block"
        style={{ height: reducedMotion ? "auto" : `calc(100vh + ${RUNWAY_VH}vh)` }}
      >
        <div className="sticky top-0 h-screen flex items-center overflow-hidden px-6">
          <div className="w-full max-w-[1600px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>{LEFT_COLUMN}</Reveal>

            <Reveal delay={0.1}>
              <Link
                href="/studio"
                className="group relative block overflow-hidden"
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--kov-border)",
                  boxShadow: "0 40px 90px rgba(0, 0, 0, 0.55)",
                }}
              >
                <div className="relative w-full" style={{ aspectRatio: "1280 / 560" }}>
                  <video
                    ref={videoRef}
                    src="/home/studio-showreel.mp4"
                    poster="/home/studio-showreel-poster.webp"
                    muted
                    playsInline
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, transparent 60%, rgba(5,5,5,0.7))" }}
                  />
                </div>

                <VideoChrome chromeRef={chromeRef} outroRef={outroRef} />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Mobile — no pinned scrub (scroll-tied video seeking is unreliable
          on touch scroll), a normal autoplaying muted loop instead. */}
      <div className="md:hidden px-6 py-24">
        {LEFT_COLUMN}
        <div
          className="relative mt-10 overflow-hidden"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--kov-border)",
            aspectRatio: "1280 / 560",
          }}
        >
          <video
            src="/home/studio-showreel.mp4"
            poster="/home/studio-showreel-poster.webp"
            muted
            playsInline
            loop
            autoPlay
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, transparent 60%, rgba(5,5,5,0.7))" }}
          />
          <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
            <p className="text-kov-bone text-xs uppercase tracking-widest">Le Portal — Entrée du studio</p>
            <Link href="/studio" className="text-kov-bone text-xs uppercase tracking-widest">
              Visiter →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
