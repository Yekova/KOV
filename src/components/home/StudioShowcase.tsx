"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, initGsap, pinAndTrack, GSAP_REVEAL_EASE } from "@/lib/motion";

// Extra scroll distance (vh) for the desktop pinned runway — the video
// scrubs across the first VIDEO_SPLIT share of it (the portal also grows
// very slightly over this same stretch), then holds on the last frame
// while the outro (black + KOV mark + spark) fades in over the rest —
// alongside the text column and photo strip, which recede with it rather
// than sitting frozen next to a faded-out video.
const RUNWAY_VH = 180;
const VIDEO_SPLIT = 0.85;
const GROWTH_SCALE = 0.04; // 1.00 -> 1.04 across the runway
const MAX_TILT_DEG = 1.4;
const PORTAL_MAX_WIDTH = 600;

// Real crops of the two real Studio rooms (public/studio/panoramas/p01,
// p02.webp), different angles than the ones already used for the room
// thumbnails/carousel — not the video, which is a mood/atmosphere clip,
// not footage of an actual KOV room.
const STUDIO_PHOTOS = [
  { src: "/studio/covers/studio-detail-01.webp", alt: "KOV, accueil du Portal", caption: "Portal — Accueil" },
  { src: "/studio/covers/studio-detail-02.webp", alt: "Corridor du Portal, salle P01", caption: "Portal — Corridor" },
  { src: "/studio/covers/studio-detail-03.webp", alt: "Espace lounge, Design Studio, salle P02", caption: "Design Studio" },
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

function PhotoStrip({ stripRef }: { stripRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={stripRef} className="mt-5 grid grid-cols-3 gap-3">
      {STUDIO_PHOTOS.map((photo) => (
        <div key={photo.src} className="relative overflow-hidden" style={{ borderRadius: 14, aspectRatio: "4 / 3" }}>
          <Image src={photo.src} alt={photo.alt} fill sizes="200px" className="object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, transparent 60%, rgba(5,5,5,0.65))" }}
          />
          <p className="absolute bottom-2 left-2.5 right-2 text-kov-bone text-[9px] uppercase tracking-widest">
            {photo.caption}
          </p>
        </div>
      ))}
    </div>
  );
}

// Right after Expertise — the KOV Virtual Studio (src/app/studio) is real,
// already built and live, not a mockup. The video is the section's own
// centerpiece: a liquid-glass portal with real depth (cursor tilt +
// parallax) and a scroll-scrubbed cinematic clip, deliberately free of
// any overlay chrome so nothing competes with it. Real photos of the two
// actual rooms sit below it as supporting proof. The full Three.js engine
// stays on /studio — this is a lightweight preview, per its own weight
// budget.
export function StudioShowcase() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const textColRef = useRef<HTMLDivElement>(null);
  const entranceRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reflectionRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
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

  // Scroll-scrub: video frame + portal growth, then the outro (video fades
  // to black/KOV/spark) while the text column and photo strip recede with
  // it (fade, rise, soften) instead of sitting frozen next to a blacked-
  // out video.
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

        if (textColRef.current) {
          textColRef.current.style.opacity = String(1 - outroT);
          textColRef.current.style.transform = `translateY(${(-outroT * 20).toFixed(1)}px)`;
          textColRef.current.style.filter = outroT > 0.01 ? `blur(${(outroT * 5).toFixed(1)}px)` : "";
        }
        if (filmstripRef.current) {
          filmstripRef.current.style.opacity = String(1 - outroT);
          filmstripRef.current.style.transform = `scale(${(1 - outroT * 0.08).toFixed(3)}) translateY(${(outroT * 14).toFixed(1)}px)`;
        }
      },
      { pin: false, end: `+=${RUNWAY_VH}%` }
    );

    return () => trigger.kill();
  }, [reducedMotion]);

  // One coordinated entrance timeline: heading, then CTA, then the video
  // portal (a clip-path wipe alongside blur/scale/translateX — a curtain
  // opening, not a fade), then the photos one by one. Runs on entranceRef
  // + headingRef/ctaRef/filmstripRef only — shellRef (continuous scroll-
  // growth/tilt transform) is never touched here, so the two mechanisms
  // never fight over the same inline style.
  useEffect(() => {
    if (reducedMotion) return;
    const heading = headingRef.current;
    const cta = ctaRef.current;
    const portal = entranceRef.current;
    const filmstrip = filmstripRef.current;
    const runway = runwayRef.current;
    if (!heading || !cta || !portal || !filmstrip || !runway) return;
    initGsap();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: runway, start: "top 75%", toggleActions: "play none none reverse" },
      });

      tl.fromTo(heading, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 0.75, ease: GSAP_REVEAL_EASE })
        .fromTo(cta, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.6, ease: GSAP_REVEAL_EASE }, "-=0.4")
        .fromTo(
          portal,
          { opacity: 0, x: 120, scale: 0.9, filter: "blur(18px)", clipPath: "inset(0% 100% 0% 0%)" },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            filter: "blur(0px)",
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.2,
            ease: GSAP_REVEAL_EASE,
          },
          "-=0.45"
        )
        .fromTo(
          Array.from(filmstrip.children),
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: GSAP_REVEAL_EASE },
          "-=0.5"
        );
    }, runway);

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
            className="w-full max-w-[1600px] mx-auto grid items-center gap-10"
            style={{ gridTemplateColumns: "minmax(320px, 45%) 1fr" }}
          >
            <div ref={textColRef}>
              <div ref={headingRef}>
                <p className="text-xs uppercase tracking-widest text-kov-steel">{TEXT.eyebrow}</p>
                <h2
                  className="mt-4 font-display text-kov-bone uppercase font-bold"
                  style={{ fontSize: "clamp(32px, 4vw, 58px)", lineHeight: "var(--line-height-display)" }}
                >
                  {TEXT.heading}
                </h2>
                <p className="mt-6 text-kov-steel text-sm leading-relaxed max-w-sm">{TEXT.body}</p>
              </div>

              <div ref={ctaRef} className="mt-8">
                <StudioCTA />
                <p className="mt-6 text-kov-steel text-[10px] uppercase tracking-widest leading-relaxed opacity-70">
                  {TEXT.microline}
                </p>
              </div>
            </div>

            <div style={{ maxWidth: PORTAL_MAX_WIDTH }}>
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
                        borderRadius: "36px 24px 36px 24px / 36px 24px 36px 24px",
                        border: "1px solid rgba(255,255,255,0.10)",
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -50px 70px rgba(0,0,0,0.55), 0 40px 80px rgba(0,0,0,0.55), 0 0 70px rgba(227,30,36,0.08)",
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

                      <div
                        ref={outroRef}
                        aria-hidden="true"
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
                        style={{ background: "var(--kov-black)", opacity: 0 }}
                      >
                        <svg
                          width="26"
                          height="26"
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
                  </div>
                </Link>
              </div>

              <PhotoStrip stripRef={filmstripRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/tablet — no pin (scroll-tied video seeking + cursor tilt
          don't apply on touch), a normal autoplaying muted loop. */}
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
          className="relative mt-10 overflow-hidden"
          style={{
            borderRadius: 28,
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
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {STUDIO_PHOTOS.map((photo) => (
            <div
              key={photo.src}
              className="relative overflow-hidden"
              style={{ borderRadius: 12, aspectRatio: "4 / 3" }}
            >
              <Image src={photo.src} alt={photo.alt} fill sizes="120px" className="object-cover" />
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
