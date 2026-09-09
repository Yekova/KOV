"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { gsap, initGsap, pinAndTrack, motion, GSAP_REVEAL_EASE } from "@/lib/motion";

// Extra scroll distance (vh) for the desktop pinned runway — the video
// scrubs across the first VIDEO_SPLIT share of it (the portal also grows
// very slightly over this same stretch), then holds on the last frame
// while the outro (black + KOV mark + spark) fades in over the rest.
const RUNWAY_VH = 180;
const VIDEO_SPLIT = 0.85;
const GROWTH_SCALE = 0.04; // 1.00 -> 1.04 across the runway
const MAX_TILT_DEG = 1.4;

const BADGES = [
  {
    label: "Navigation 360°",
    className: "-top-5 -left-5 md:-top-6 md:-left-8",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2v20M2 12h20" />
        <path d="M5 9l-3 3 3 3M19 9l3 3-3 3M9 5l3-3 3 3M9 19l3 3 3-3" />
      </svg>
    ),
  },
  {
    label: "Hotspots",
    className: "-top-3 -right-6 md:-top-4 md:-right-10",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Multi-device",
    className: "-bottom-6 -left-4 md:-bottom-8 md:-left-6",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2.5" y="4" width="13" height="10" rx="1.3" />
        <rect x="14.5" y="9" width="7" height="11" rx="1.3" />
      </svg>
    ),
  },
  {
    label: "WebGL",
    className: "-bottom-4 -right-5 md:-bottom-6 md:-right-9",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2.5l8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4z" />
        <path d="M3.5 7.4l8.5 4.9 8.5-4.9M12 12.3v9.2" />
      </svg>
    ),
  },
];

const TEXT = {
  eyebrow: "Studio virtuel",
  heading: (
    <>
      Vos espaces,
      <br />
      en <span className="text-kov-red">360°</span>.
    </>
  ),
  body: "On conçoit le même type d'expérience immersive que celle-ci pour vos propres espaces — un lieu réel, capturé en 360° et transformé en visite interactive, navigable et mémorable.",
  microline: (
    <>
      Une autre façon
      <br />
      de découvrir l&apos;espace
    </>
  ),
};

// Bespoke premium capsule — not the standard <Button/> (a rectangular
// flat-fill CTA), by explicit request: a wide smoked-glass pill, a solid
// red circular icon on the left, halo only on hover.
function StudioCTA() {
  return (
    <Link
      href="/studio"
      className="group relative inline-flex items-center gap-4 pl-2 pr-7 py-2 overflow-hidden transition-colors duration-300"
      style={{
        borderRadius: "var(--radius-pill)",
        background: "rgba(10,6,6,0.55)",
        border: "1px solid rgba(227,30,36,0.25)",
        backdropFilter: "blur(var(--glass-blur)) saturate(160%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(160%)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(circle at 14% 50%, rgba(227,30,36,0.4), transparent 65%)" }}
      />
      <span
        aria-hidden="true"
        className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:translate-x-1"
        style={{ background: "var(--kov-red)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--kov-white)" strokeWidth="2.2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
      <span className="relative text-kov-bone text-xs uppercase tracking-widest">Explorer le studio</span>
    </Link>
  );
}

function PortalBadge({ label, icon, className }: { label: string; icon: React.ReactNode; className: string }) {
  return (
    <div
      className={`group/badge absolute hidden lg:flex items-center gap-2 px-3 py-2 transition-transform duration-300 hover:-translate-y-0.5 ${className}`}
      style={{
        borderRadius: "var(--radius-pill)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <span className="text-kov-bone" aria-hidden="true">
        {icon}
      </span>
      <span className="text-kov-bone text-[10px] uppercase tracking-widest whitespace-nowrap">{label}</span>
      <span
        aria-hidden="true"
        className="w-1.5 h-1.5 rounded-full bg-kov-red transition-shadow duration-300 group-hover/badge:shadow-[0_0_8px_2px_rgba(227,30,36,0.7)]"
      />
    </div>
  );
}

function CenterControl() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-105"
        style={{ background: "rgba(8,6,6,0.35)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.14)" }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: "0 0 36px rgba(227,30,36,0.4)" }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full animate-spin motion-reduce:animate-none"
          style={{ animationDuration: "18s", border: "1px solid rgba(227,30,36,0.2)", borderTopColor: "rgba(227,30,36,0.65)" }}
        />
        <p className="font-display text-kov-bone text-sm tracking-widest">360°</p>
        <p className="text-kov-steel text-[9px] uppercase tracking-widest mt-1 hidden md:block">Drag</p>
        <p className="text-kov-steel text-[9px] uppercase tracking-widest mt-1 md:hidden">Touch</p>
      </div>
    </div>
  );
}

// Right after Expertise — the KOV Virtual Studio (src/app/studio) is real,
// already built and live, not a mockup. The video is the section's own
// centerpiece (a "portal", not a screenshot card): a liquid-glass object
// with real depth (cursor tilt + parallax), floating capability badges,
// a live 360°/drag hint, and a scroll-scrubbed cinematic pass through the
// Portal room. The full Three.js engine stays on /studio — this is a
// lightweight preview, per its own weight budget.
export function StudioShowcase() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const entranceRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reflectionRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const chromeOuterRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);
  const scrollScaleRef = useRef(1);
  const tiltRef = useRef({ x: 0, y: 0 });
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  function applyShellTransform() {
    const shell = shellRef.current;
    if (!shell) return;
    const { x, y } = tiltRef.current;
    shell.style.transform = `perspective(1000px) scale(${scrollScaleRef.current}) rotateX(${x}deg) rotateY(${y}deg)`;
  }

  // Scroll-scrub (video frame + portal growth + outro fade) — same
  // pinAndTrack pattern as every other scroll-driven section, `pin:false`
  // since CSS `sticky` (below) does the actual pinning.
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
        scrollScaleRef.current = 1 + gsap.utils.clamp(0, 1, progress) * GROWTH_SCALE;
        applyShellTransform();

        const outroT = gsap.utils.clamp(0, 1, (progress - VIDEO_SPLIT) / (1 - VIDEO_SPLIT));
        if (outroRef.current) outroRef.current.style.opacity = String(outroT);
        if (chromeRef.current) chromeRef.current.style.opacity = String(1 - outroT);
        if (chromeOuterRef.current) chromeOuterRef.current.style.opacity = String(1 - outroT);
      },
      { pin: false, end: `+=${RUNWAY_VH}%` }
    );

    return () => trigger.kill();
  }, [reducedMotion]);

  // One-time arrival (opacity/blur/scale/translateX) as the portal first
  // scrolls into view — a separate GSAP tween on a separate element
  // (entranceRef, not shellRef) so it never fights the continuous
  // scroll-growth/tilt transform above, which owns shellRef exclusively.
  useEffect(() => {
    if (reducedMotion) return;
    const el = entranceRef.current;
    if (!el) return;
    initGsap();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, x: 80, scale: 0.96, filter: "blur(12px)" },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: motion.slow,
          ease: GSAP_REVEAL_EASE,
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [reducedMotion]);

  function handlePointerMove(e: React.PointerEvent<HTMLAnchorElement>) {
    if (reducedMotion || e.pointerType !== "mouse") return;
    const shell = shellRef.current;
    if (!shell) return;
    const rect = shell.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;

    shell.style.transition = "none";
    tiltRef.current = { x: Number((-py * MAX_TILT_DEG).toFixed(2)), y: Number((px * MAX_TILT_DEG).toFixed(2)) };
    applyShellTransform();

    if (videoRef.current) {
      videoRef.current.style.transition = "none";
      videoRef.current.style.transform = `scale(1.02) translate(${(px * 1.5).toFixed(2)}%, ${(py * 1.5).toFixed(2)}%)`;
    }
    if (reflectionRef.current) {
      reflectionRef.current.style.transition = "none";
      reflectionRef.current.style.transform = `translate(${(px * 8).toFixed(2)}%, ${(py * 8).toFixed(2)}%)`;
    }
  }

  function handlePointerLeave() {
    if (reducedMotion) return;
    const ease = "transform 0.6s cubic-bezier(0.16,1,0.3,1)";
    tiltRef.current = { x: 0, y: 0 };
    if (shellRef.current) {
      shellRef.current.style.transition = ease;
      applyShellTransform();
    }
    if (videoRef.current) {
      videoRef.current.style.transition = ease;
      videoRef.current.style.transform = "scale(1) translate(0%, 0%)";
    }
    if (reflectionRef.current) {
      reflectionRef.current.style.transition = ease;
      reflectionRef.current.style.transform = "translate(0%, 0%)";
    }
  }

  return (
    <section id="studio-showcase" className="relative">
      {/* Desktop — pinned runway, video scrubbed by scroll, portal reacts
          to the cursor. */}
      <div
        ref={runwayRef}
        className="relative hidden md:block"
        style={{ height: reducedMotion ? "auto" : `calc(100vh + ${RUNWAY_VH}vh)` }}
      >
        <div className="sticky top-0 h-screen flex items-center overflow-hidden px-6">
          <div
            className="w-full max-w-[1700px] mx-auto grid items-center gap-8"
            style={{ gridTemplateColumns: "minmax(280px, 30%) 1fr" }}
          >
            <div>
              <Reveal>
                <p className="text-xs uppercase tracking-widest text-kov-steel">{TEXT.eyebrow}</p>
                <h2
                  className="mt-4 font-display text-kov-bone uppercase font-bold"
                  style={{ fontSize: "clamp(32px, 4vw, 58px)", lineHeight: "var(--line-height-display)" }}
                >
                  {TEXT.heading}
                </h2>
                <p className="mt-6 text-kov-steel text-sm leading-relaxed max-w-sm">{TEXT.body}</p>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="mt-8">
                  <StudioCTA />
                </div>
                <p className="mt-6 text-kov-steel text-[10px] uppercase tracking-widest leading-relaxed opacity-70">
                  {TEXT.microline}
                </p>
              </Reveal>
            </div>

            <div ref={entranceRef} className="relative">
              <Link
                href="/studio"
                className="group relative block"
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              >
                <div ref={shellRef} className="relative" style={{ willChange: "transform" }}>
                  <div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "1280 / 560",
                      background: "#000",
                      borderRadius: "44px 30px 44px 30px / 44px 30px 44px 30px",
                      border: "1px solid rgba(255,255,255,0.10)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -50px 70px rgba(0,0,0,0.55), 0 50px 100px rgba(0,0,0,0.55), 0 0 90px rgba(227,30,36,0.08)",
                    }}
                  >
                    <video
                      ref={videoRef}
                      src="/home/studio-showreel.mp4"
                      poster="/home/studio-showreel-poster.webp"
                      muted
                      playsInline
                      preload="auto"
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ transition: "transform 0.4s ease" }}
                    />

                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(180deg, transparent 55%, rgba(5,5,5,0.75))" }}
                    />

                    <div
                      ref={reflectionRef}
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.05) 100%)",
                        mixBlendMode: "screen",
                      }}
                    />

                    <div
                      aria-hidden="true"
                      className="absolute bottom-0 inset-x-10 h-px pointer-events-none"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(227,30,36,0.7), transparent)",
                        boxShadow: "0 0 12px 2px rgba(227,30,36,0.5)",
                      }}
                    />

                    <div ref={chromeRef}>
                      <CenterControl />
                    </div>

                    <div
                      ref={outroRef}
                      aria-hidden="true"
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
                      style={{ background: "var(--kov-black)", opacity: 0 }}
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="var(--kov-red)"
                        style={{ filter: "drop-shadow(0 0 12px rgba(227,30,36,0.65))" }}
                      >
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                      </svg>
                      <p className="font-display text-kov-bone uppercase tracking-widest text-sm">KOV</p>
                      <p className="text-kov-steel uppercase tracking-widest text-[10px]">Virtual Studio</p>
                    </div>
                  </div>

                  <div ref={chromeOuterRef}>
                    {BADGES.map((badge) => (
                      <PortalBadge key={badge.label} {...badge} />
                    ))}

                    <div className="absolute -bottom-8 right-2 flex items-center gap-2">
                      <span aria-hidden="true" className="w-6 h-px" style={{ background: "var(--glass-border)" }} />
                      <p className="text-kov-steel text-[9px] uppercase tracking-widest whitespace-nowrap">
                        Le portail vers vos espaces
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="hidden xl:flex absolute bottom-10 left-6 items-center gap-3">
            <p className="font-mono text-[10px] text-kov-steel">01 / 04</p>
            <div className="w-16 h-px overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full w-1/4" style={{ background: "var(--kov-red)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/tablet — no pin (scroll-tied video seeking + cursor tilt
          don't apply on touch), a normal autoplaying muted loop with the
          badges collapsed into a simple row below. */}
      <div className="md:hidden px-6 py-24">
        <p className="text-xs uppercase tracking-widest text-kov-steel">{TEXT.eyebrow}</p>
        <h2
          className="mt-4 font-display text-kov-bone uppercase font-bold"
          style={{ fontSize: "clamp(32px, 9vw, 44px)", lineHeight: "var(--line-height-display)" }}
        >
          {TEXT.heading}
        </h2>
        <p className="mt-6 text-kov-steel text-sm leading-relaxed">{TEXT.body}</p>

        <div
          className="group relative mt-10 overflow-hidden"
          style={{
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.10)",
            aspectRatio: "4 / 5",
            background: "#000",
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
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, transparent 55%, rgba(5,5,5,0.75))" }}
          />
          <CenterControl />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <p className="text-kov-bone text-[10px] uppercase tracking-widest">Le portail vers vos espaces</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {BADGES.map(({ label, icon }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-2"
              style={{
                borderRadius: "var(--radius-pill)",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <span className="text-kov-bone" aria-hidden="true">
                {icon}
              </span>
              <span className="text-kov-bone text-[10px] uppercase tracking-widest whitespace-nowrap">{label}</span>
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
            </div>
          ))}
        </div>

        <div className="mt-8">
          <StudioCTA />
        </div>
        <p className="mt-6 text-kov-steel text-[10px] uppercase tracking-widest leading-relaxed opacity-70">
          {TEXT.microline}
        </p>
      </div>
    </section>
  );
}
