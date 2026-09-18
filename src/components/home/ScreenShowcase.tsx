"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, initGsap, motion, stagger, GSAP_REVEAL_EASE } from "@/lib/motion";
import { ScrollFloat } from "@/components/ui/ScrollFloat";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import "./ScreenShowcase.css";

// Six translations, read left to right as sentences. A two-column table with
// a divider down the middle would be the generic SaaS comparison this section
// exists to argue against — the form has to make the point too, not just the
// words.
const COMPARISON = [
  { standard: "Template", kov: "Direction artistique" },
  { standard: "Pages isolées", kov: "Parcours cohérent" },
  { standard: "Animations décoratives", kov: "Motion utile" },
  { standard: "Responsive adapté", kov: "Responsive pensé dès le départ" },
  { standard: "CMS basique", kov: "Système évolutif" },
  { standard: "Site web", kov: "Univers digital" },
] as const;

// The "why KOV" moment, placed third: the visitor has seen the approach and
// now needs to know what makes it different from what they'd get anywhere.
//
// This section used to show /kov/home/dashboard-showcase.png captioned "Votre
// système intégré". That image is a light-blue generic SaaS dashboard with
// fabricated figures (128 420 €, 98 % de satisfaction), invented clients and a
// stock-photo person. Placing it on the KOV side of a comparison whose left
// column reads "Template / Animations décoratives / Site web" was
// self-refuting — the exhibit was the thing being criticised — and the numbers
// on it were invented, which this project does not do. Removed.
//
// Consequence worth knowing: this was the site's ONLY light zone
// (useLightZone), the mechanism by which Nav and GlobalMenuButton flip their
// wordmark to black when they scroll over something bright. The registry in
// navThemeRegistry.ts and useOnLightZone stay in place and keep working —
// `onLight` simply always resolves false now, which is correct on a page
// that is dark from top to bottom. Do not delete that machinery; it becomes
// useful again the day a light section returns.
export function ScreenShowcase() {
  const cardRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLUListElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const card = cardRef.current;
    const rows = rowsRef.current;
    if (!card || !rows) return;
    initGsap();

    const ctx = gsap.context(() => {
      // One timeline, not two ScrollTriggers. Reveal cannot be used for the
      // rows: its IntersectionObserver fires on geometry, and the card enters
      // at opacity 0 — every nested Reveal would trip and finish while
      // nothing was visible yet, spending the stagger before anyone saw it.
      const tl = gsap.timeline({
        // "top bottom" — the earliest possible onset, so the card starts
        // arriving as soon as its top edge is reachable rather than after a
        // gap once the section above has fully passed.
        scrollTrigger: { trigger: card, start: "top bottom", toggleActions: "play none none reverse" },
      });

      tl.fromTo(
        card,
        { opacity: 0, y: 120, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: motion.slow, ease: GSAP_REVEAL_EASE }
      ).fromTo(
        rows.querySelectorAll("li"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: motion.normal, ease: GSAP_REVEAL_EASE, stagger: stagger.tight },
        "-=0.35"
      );
    }, card);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="showcase" className="px-6 py-32 max-w-[1600px] mx-auto">
      {/* The \n forces the two-line split rather than leaving it to the
          viewport, and line-height is lifted off the global 0.85 — at that
          value the scrubbed characters visibly cross into the line below on
          a multi-line title. */}
      <ScrollFloat
        containerClassName="text-center mb-24 md:mb-36"
        textClassName="font-display text-kov-bone uppercase text-[clamp(26px,3.4vw,54px)] leading-[0.95]"
        stagger={0.02}
      >
        {"Un site n'est pas une page.\nC'est un système."}
      </ScrollFloat>

      <div
        ref={cardRef}
        className="max-w-[1200px] mx-auto border overflow-hidden"
        style={{
          borderColor: "var(--kov-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
        }}
      >
        <BrowserChrome />

        <div className="px-6 md:px-12 py-10 md:py-14" style={{ background: "var(--kov-carbon)" }}>
          <div className="hidden md:grid grid-cols-[1fr_auto_1.15fr] items-center pb-5">
            <p className="text-kov-steel text-[10px] uppercase" style={{ letterSpacing: "0.2em" }}>
              Site standard
            </p>
            <span aria-hidden="true" />
            <p
              className="flex items-center gap-2.5 text-kov-bone text-[10px] uppercase"
              style={{ letterSpacing: "0.2em" }}
            >
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--kov-red)" }} />
              Expérience KOV
            </p>
          </div>

          <ul ref={rowsRef} className="list-none">
            {COMPARISON.map((row, index) => (
              <li
                key={row.kov}
                className="kov-sysrow grid grid-cols-1 md:grid-cols-[1fr_auto_1.15fr] md:items-center gap-1.5 md:gap-0 py-4 md:py-0"
                style={{ borderTop: index === 0 ? "none" : "1px solid var(--kov-border)" }}
              >
                {/* Deliberately inert: no relief, no tracking, dimmed. The
                    flatness is the argument. */}
                <span className="kov-sysrow__flat text-kov-steel text-sm md:py-5">{row.standard}</span>

                <span aria-hidden="true" className="hidden md:flex items-center px-7">
                  <span className="kov-sysrow__rule" />
                  <span className="kov-sysrow__node" />
                </span>

                {/* Real HTML text, so a screen reader linearises each row as
                    "Template devient Direction artistique" — a sentence
                    rather than two orphaned nouns. */}
                <span className="sr-only"> devient </span>

                <span className="kov-sysrow__kov md:py-5">
                  <span className="kov-sysrow__index font-mono">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-kov-bone text-sm uppercase tracking-wide">{row.kov}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
