"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pinAndTrack } from "@/lib/motion/transitions";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Reveal } from "@/components/ui/Reveal";
import { EXPERTISE_STEPS, rectCentre } from "./expertiseLayout";
import { ExpertiseCompilationCard } from "./ExpertiseCompilationCard";
import "./ExpertiseCompilation.css";

// How long the sticky runway is, and how that length is spent.
const RUNWAY_VH = 560;
// The title holds the frame, then gives it up. Short, because it is an
// announcement rather than a section of its own.
const TITLE_END = 0.14;
// Where the last card has landed and the composition simply holds while the
// invitation arrives.
const CARDS_END = 0.86;
// How far in the first card is framed before the view pulls back. 1 would be
// the finished composition; this is the zoom that makes card 01 read as the
// only thing on screen.
const OPENING_SCALE = 1.9;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
// Ease-out cubic. The pull-back should decelerate into its final position
// rather than arrive at constant speed.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const TOTAL = String(EXPERTISE_STEPS.length).padStart(2, "0");

// The section title, in both branches. One copy, so the sequence and the
// plain list cannot drift apart.
function Heading() {
  return (
    <>
      <p className="kov-xp-eyebrow">
        <span aria-hidden="true" className="kov-xp-eyebrow__dot" />
        {TOTAL} expertises
      </p>
      <h2 className="kov-xp-title">
        Six expertises.
        <br />
        Une structure vivante.
      </h2>
    </>
  );
}

// Where the section hands over. It used to be #spotlight; with that section
// gone, the projects are the honest answer to what six assembled expertises
// produce — and they are the next thing down the page either way.
function Outro() {
  return (
    <Link href="/#work-gallery" className="kov-xp-outro__link">
      Voir ce que cela donne
      <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
    </Link>
  );
}

// The expertises, assembling.
//
// The section opens empty, the first card materialises alone and filling the
// frame, and each scroll beat lands another one while the view pulls back to
// make room — until six cards form a single composition. The argument is the
// behaviour: KOV does not juxtapose skills, it assembles them, and the only
// honest way to say that is to show it happening.
//
// How it works, and why this way:
//
//  - Every card is absolutely positioned at its FINAL rect from the first
//    frame (percentages, see expertiseLayout). Nothing about the layout ever
//    changes. What animates is one transform on the stage and one transform
//    per card, which is the only version of this effect that does not
//    re-lay-out the page sixty times a second.
//  - The "cards get smaller as others arrive" reading comes from the stage
//    pulling back, not from the cards resizing. Same impression, one
//    property, no reflow.
//  - `pinAndTrack` supplies scroll progress with pin:false; CSS `sticky`
//    does the actual pinning. That is the convention already used elsewhere
//    on this page, and it means GSAP never injects a pin-spacer.
//  - Writes go straight to `style` inside the scrub callback rather than
//    through React state. Six cards re-rendering per scroll frame would be
//    sixty renders a second for values React has no opinion about.
export function ExpertiseCompilation() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const outroRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const dotsRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Below lg the sequence is replaced by a plain vertical progression: a
  // 560vh pinned runway on a phone is a scroll trap. Under reduced motion it
  // is replaced for the obvious reason.
  const isCompact = useMediaQuery("(max-width: 1023px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const sequenced = !isCompact && !reducedMotion;

  useEffect(() => {
    if (!sequenced) return;
    const runway = runwayRef.current;
    const stage = stageRef.current;
    if (!runway || !stage) return;

    // Where the stage must sit for card 01 to be centred in the frame at
    // OPENING_SCALE. With the transform origin at the stage centre C, a
    // point p lands at C + T + S·(p − C), so centring p means T = S·(C − p).
    // Derived rather than tuned by hand, so moving a card in
    // expertiseLayout cannot silently break the opening.
    const first = rectCentre(EXPERTISE_STEPS[0].rect);
    const openX = (50 - first.x) * OPENING_SCALE;
    const openY = (50 - first.y) * OPENING_SCALE;

    const apply = (progress: number) => {
      // ── The title gives up the frame ────────────────────────────────
      const titleOut = clamp01(progress / TITLE_END);
      const title = titleRef.current;
      if (title) {
        title.style.opacity = String(1 - titleOut);
        title.style.transform = `translateY(${titleOut * -24}px) scale(${1 - titleOut * 0.12})`;
      }

      // ── The stage pulls back ────────────────────────────────────────
      const seq = clamp01((progress - TITLE_END) / (CARDS_END - TITLE_END));
      const pull = easeOut(seq);
      const scale = OPENING_SCALE + (1 - OPENING_SCALE) * pull;
      stage.style.transform = `translate(${openX * (1 - pull)}%, ${openY * (1 - pull)}%) scale(${scale})`;

      // ── Each card lands in turn ─────────────────────────────────────
      const spread = seq * EXPERTISE_STEPS.length;
      let landed = 0;
      for (let i = 0; i < EXPERTISE_STEPS.length; i += 1) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const t = easeOut(clamp01(spread - i));
        if (t > 0.5) landed = i + 1;
        el.style.opacity = String(t);
        // Rise, settle, sharpen. The blur is what makes a card read as
        // materialising rather than sliding in — and it is only ever on a
        // card mid-transition, never on one at rest, so nothing is being
        // blurred continuously.
        el.style.transform = `translateY(${(1 - t) * 54}px) scale(${0.94 + t * 0.06})`;
        el.style.filter = t > 0.995 ? "none" : `blur(${(1 - t) * 7}px)`;
      }

      // ── The discreet progress read ──────────────────────────────────
      const counter = counterRef.current;
      if (counter) {
        counter.textContent = String(Math.max(1, landed)).padStart(2, "0");
      }
      for (let i = 0; i < EXPERTISE_STEPS.length; i += 1) {
        const dot = dotsRef.current[i];
        if (dot) dot.style.opacity = i < landed ? "1" : "0.22";
      }

      // ── The invitation, once the structure stands ───────────────────
      const outro = outroRef.current;
      if (outro) {
        const t = clamp01((progress - CARDS_END) / (1 - CARDS_END));
        outro.style.opacity = String(t);
        outro.style.transform = `translateX(-50%) translateY(${(1 - t) * 14}px)`;
      }
    };

    const trigger = pinAndTrack(runway, apply, { pin: false, end: `+=${RUNWAY_VH}%` });
    // A scrub trigger only calls back when the scroll position moves inside
    // its range. Someone who reloads or deep-links into the middle of the
    // section would otherwise sit on the untouched opening state until they
    // scrolled; this puts the composition where their scroll position says
    // it should be.
    apply(trigger.progress);

    return () => trigger.kill();
  }, [sequenced]);

  // ── The plain version: tablet, phone, reduced motion ─────────────────
  if (!sequenced) {
    return (
      <div className="kov-xp-plain">
        <Reveal variant="blur">
          <Heading />
        </Reveal>

        <div className="kov-xp-plain__list">
          {EXPERTISE_STEPS.map((step, i) => (
            <Reveal key={step.slug} delay={i * 0.06}>
              <ExpertiseCompilationCard step={step} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="kov-xp-outro kov-xp-outro--plain">
            <Outro />
          </div>
        </Reveal>
      </div>
    );
  }

  // ── The sequence ─────────────────────────────────────────────────────
  return (
    <div
      ref={runwayRef}
      className="kov-xp-runway"
      // The stylesheet reads this, behind the same breakpoint the branch
      // above uses — so RUNWAY_VH is stated once, in one file.
      style={{ "--kov-xp-runway-h": `calc(100vh + ${RUNWAY_VH}vh)` } as React.CSSProperties}
    >
      <div className="kov-xp-viewport">
        {/* The title holds the empty frame, then hands it to card 01. It is
            in the DOM from the start and never removed — only faded — so it
            stays readable to a crawler and to assistive tech. */}
        <div ref={titleRef} className="kov-xp-intro">
          <Heading />
        </div>

        <div ref={stageRef} className="kov-xp-stage">
          {EXPERTISE_STEPS.map((step, i) => (
            <div
              key={step.slug}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="kov-xp-slot"
              style={{
                left: `${step.rect.x}%`,
                top: `${step.rect.y}%`,
                width: `${step.rect.w}%`,
                height: `${step.rect.h}%`,
                opacity: 0,
              }}
            >
              <ExpertiseCompilationCard step={step} />
            </div>
          ))}
        </div>

        {/* Six dots and a counter. That is the ceiling for progress here: a
            full timeline would compete with the thing it reports on. */}
        <div aria-hidden="true" className="kov-xp-progress">
          <span ref={counterRef} className="kov-xp-progress__num">
            01
          </span>
          <span className="kov-xp-progress__sep">/</span>
          <span className="kov-xp-progress__num kov-xp-progress__num--total">{TOTAL}</span>
          <span className="kov-xp-progress__dots">
            {EXPERTISE_STEPS.map((step, i) => (
              <span
                key={step.slug}
                ref={(el) => {
                  dotsRef.current[i] = el;
                }}
                className="kov-xp-progress__dot"
              />
            ))}
          </span>
        </div>

        <div ref={outroRef} className="kov-xp-outro" style={{ opacity: 0 }}>
          <Outro />
        </div>
      </div>
    </div>
  );
}
