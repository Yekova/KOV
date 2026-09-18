"use client";

import { useState } from "react";
import { PROCESS } from "@/data/processSteps";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

// Reassurance, placed right after the visitor has recognised their own
// problem in #philosophy. Deliberately the quietest section of the four:
// numbers, labels, a rule, and one line of text at a time. No pinning, no
// scrub, no 3D — the page has already spent its spectacle on StudioShowcase
// and the rhythm from here has to descend toward the CTA.
//
// Every word comes from src/data/processSteps.ts, which already held these
// exact seven steps with real written bodies and is already rendered on
// /expertise. Nothing here is newly invented.
//
// Client Component purely for the active-step state. One file rather than a
// server shell plus a client child: the section imports no animation library,
// so the bundle delta is tiny, and StudioShowcase/ExpertiseTeaser are both
// whole-section clients already.
export function ProcessTimeline() {
  const [active, setActive] = useState(0);
  // Read once at mount, the pattern used by Reveal, ScrollFloat,
  // StudioShowcase and ExpertiseTeaser.
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // The mobile accordion can close to -1; the desktop block is display:none
  // but still rendered, so it must not read PROCESS[-1]. Falling back to the
  // first step keeps the reserved panel filled rather than blank.
  const step = PROCESS[active] ?? PROCESS[0];

  return (
    <section id="process" className="px-6 py-32 max-w-[1600px] mx-auto scroll-mt-40">
      <Reveal variant="blur">
        <SectionHeading
          eyebrow="Processus"
          title={
            <>
              Sept étapes.
              <br />
              Pas de boîte noire<span className="text-kov-red">.</span>
            </>
          }
          lede="Vous savez à tout moment où en est le projet, ce qui vient d'être fait et ce qui suit."
        />
      </Reveal>

      {/* ── Desktop: horizontal rail ───────────────────────────────────────
          lg (1024), not md: seven labels like DÉVELOPPER in ~95px columns are
          unreadable between 768 and 1023, so tablet takes the vertical form
          below instead of a squeezed rail. */}
      <div className="hidden lg:block mt-20">
        <ol className="list-none relative grid grid-cols-7">
          {/* First in the DOM on purpose: each step sits inside a Reveal that
              applies a transform, hence its own stacking context, and would
              otherwise paint over the rail. */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 h-px"
            style={{ top: 27, background: "var(--kov-border)" }}
          />
          <div
            aria-hidden="true"
            className="absolute left-0 h-px"
            style={{
              top: 27,
              width: `${(Math.max(active, 0) / (PROCESS.length - 1)) * 100}%`,
              background: "var(--kov-red)",
              opacity: 0.45,
              transition: reducedMotion ? "none" : "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          {PROCESS.map((entry, index) => {
            const isActive = index === active;
            return (
              <Reveal as="li" key={entry.number} delay={index * 0.06} className="relative">
                {/* A real button, not a div with onMouseEnter: it inherits the
                    sitewide red :focus-visible ring, CustomCursor recognises
                    it (the site sets cursor:none, so the pointer gives no
                    hover affordance of its own), and onFocus gives keyboard
                    users the same reveal as the mouse. */}
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                  aria-expanded={isActive}
                  aria-controls="process-detail"
                  className="w-full flex flex-col items-center gap-3 pt-0 pb-2"
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-[11px] tracking-widest transition-colors duration-300"
                    style={{ color: isActive ? "var(--kov-red)" : "var(--kov-steel)" }}
                  >
                    {entry.number}
                  </span>
                  <span
                    aria-hidden="true"
                    className="w-[7px] h-[7px] rounded-full transition-colors duration-300"
                    style={{ background: isActive ? "var(--kov-red)" : "var(--kov-border)" }}
                  />
                  <span
                    className="font-display uppercase text-sm transition-colors duration-300"
                    style={{ color: isActive ? "var(--kov-bone)" : "var(--kov-steel)" }}
                  >
                    {entry.title}
                  </span>
                </button>
              </Reveal>
            );
          })}
        </ol>

        {/* Fixed min-height, and this is the most important structural
            decision in the section: a panel that grew and shrank would change
            the document height mid-scroll, visibly shove #spotlight and
            #contact around, and churn Lenis' ResizeObserver. The space is
            reserved; step 07 (the longest body) sets the height. */}
        <div
          id="process-detail"
          aria-live="polite"
          className="mt-12 pt-8"
          style={{ minHeight: 108, borderTop: "1px solid var(--kov-border)" }}
        >
          <p
            key={active}
            className="text-kov-concrete text-sm leading-relaxed"
            style={{
              maxWidth: "62ch",
              // fadeInUp already exists in globals.css (added for
              // ContactWizard). It is not reduced-motion-guarded there, so
              // the guard lives here.
              animation: reducedMotion ? undefined : "fadeInUp 0.3s ease both",
            }}
          >
            <span className="text-kov-bone">{step.title}.</span> {step.body}
          </p>
        </div>
      </div>

      {/* ── Tablet & mobile: vertical timeline ─────────────────────────── */}
      <div className="lg:hidden mt-16">
        <ol className="list-none relative">
          <div
            aria-hidden="true"
            className="absolute top-2 bottom-2 w-px"
            style={{ left: 3, background: "var(--kov-border)" }}
          />
          {PROCESS.map((entry, index) => {
            const isOpen = index === active;
            return (
              <li key={entry.number} className="relative pl-8">
                <span
                  aria-hidden="true"
                  className="absolute top-[18px] w-[7px] h-[7px] rounded-full transition-colors duration-300"
                  style={{ left: 0, background: isOpen ? "var(--kov-red)" : "var(--kov-border)" }}
                />
                <button
                  type="button"
                  onClick={() => setActive(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 py-3 text-left"
                >
                  <span className="font-mono text-[11px] text-kov-steel shrink-0">{entry.number}</span>
                  <span
                    className="font-display uppercase text-sm flex-1 transition-colors duration-300"
                    style={{ color: isOpen ? "var(--kov-bone)" : "var(--kov-steel)" }}
                  >
                    {entry.title}
                  </span>
                  <span aria-hidden="true" className="text-kov-steel text-lg leading-none shrink-0">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {/* The grid-template-rows 0fr → 1fr disclosure from
                    FaqAccordionItem — the best-built version of this in the
                    repo. Layout does shift here, which is the accepted
                    accordion contract on touch. */}
                <div
                  className="grid"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transition: reducedMotion ? "none" : "grid-template-rows 0.3s ease-out",
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="text-kov-concrete text-sm leading-relaxed pb-5 pr-2">{entry.body}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
