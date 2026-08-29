"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { LegalNav } from "@/components/legal/LegalNav";
import { gsap, initGsap } from "@/lib/motion";

interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalDocProps {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}

// Shared layout for the three legal docs (legal/privacy/terms) — a real
// audit of the previous version found it disconnected from the rest of
// the site: a single centered text column, no motion, no way to jump
// between sections, no link between the three pages, and none of KOV's
// own visual language (glass, the architectural grid line, the sticky/
// scroll-aware landmarks already built for the homepage). This version
// stays deliberately restrained on content — legal text still needs to
// read as legible and trustworthy above all else, so no pinned scenes or
// scrubbed choreography here — but reuses the site's real primitives:
// `Reveal` for per-section entrances, a sticky in-page table of contents
// (same IntersectionObserver technique as KovSectionIndicator, just laid
// out inline instead of floating), and a slow GSAP-scrubbed parallax
// drift on a faint grid-line backdrop (the site's own `--kov-grid-line`
// token, defined since the initial brand pass but never actually used
// anywhere until now).
export function LegalDoc({ title, updated, intro, sections }: LegalDocProps) {
  const mainRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const elements = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    if (reducedMotion) return;
    const main = mainRef.current;
    const bg = bgRef.current;
    if (!main || !bg) return;
    initGsap();

    const ctx = gsap.context(() => {
      gsap.to(bg, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: main, start: "top top", end: "bottom bottom", scrub: true },
      });
    }, main);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <main ref={mainRef} className="relative min-h-screen px-6 pt-40 pb-32 overflow-hidden">
      {!reducedMotion && (
        <div
          ref={bgRef}
          aria-hidden="true"
          className="absolute -inset-x-0 -top-1/4 -bottom-1/4 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(var(--kov-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--kov-grid-line) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 60% 50% at 50% 20%, black 0%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 20%, black 0%, transparent 70%)",
          }}
        />
      )}

      <div className="relative max-w-5xl mx-auto">
        <LegalNav />

        <Reveal variant="blur">
          <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Document légal</p>
          <h1 className="font-display text-kov-bone uppercase" style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}>
            {title}
          </h1>
          <p className="mt-4 text-kov-steel text-xs uppercase tracking-widest">Dernière mise à jour : {updated}</p>
          <p className="mt-6 max-w-2xl text-kov-concrete text-sm leading-relaxed">{intro}</p>
        </Reveal>

        <div className="mt-20 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12 lg:gap-16">
          <nav className="hidden lg:block">
            <div className="sticky top-32 flex flex-col gap-1">
              {sections.map((section) => {
                const active = section.id === activeId;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="py-1.5 text-xs uppercase tracking-widest transition-colors border-l pl-4"
                    style={{
                      color: active ? "var(--kov-red)" : "var(--kov-steel)",
                      borderColor: active ? "var(--kov-red)" : "var(--kov-border)",
                    }}
                  >
                    {section.title}
                  </a>
                );
              })}
            </div>
          </nav>

          <div className="space-y-16 max-w-2xl text-kov-concrete text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mb-3">
            {sections.map((section, index) => (
              <Reveal key={section.id} delay={index === 0 ? 0 : 0.05}>
                <section id={section.id} className="scroll-mt-32">
                  <h2 className="font-display text-kov-bone text-xl mb-4">{section.title}</h2>
                  {section.body}
                </section>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.2}>
          <div className="mt-24 border-t pt-10 flex flex-col items-start gap-6" style={{ borderColor: "var(--kov-border)" }}>
            <p className="text-kov-concrete text-sm leading-relaxed">
              Une question sur cette page&nbsp;?
            </p>
            <Button href="/contact" variant="secondary">
              Nous contacter →
            </Button>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
