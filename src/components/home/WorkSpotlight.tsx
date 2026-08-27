"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { TagPill } from "@/components/ui/Chip";
import { Reveal } from "@/components/ui/Reveal";
import { PROJECTS } from "@/data/projects";
import { gsap, initGsap, GSAP_LIQUID_EASE } from "@/lib/motion";

// The brief's §20: "a real experience, a centerpiece" — eyebrow, then name,
// then the visual grows in importance, then the surrounding info, then the
// CTA, each stage a beat rather than everything arriving at once. A single
// scrubbed GSAP timeline against the section's own scroll range (no pin —
// same reasoning as ProcessTimeline: one composition doesn't need a held
// scene the way six converging discs do).
//
// Still pulls from the same PROJECTS array WorkGallery uses (see there for
// why) and still renders nothing if no project has shipped — a case-study
// centerpiece for a placeholder project would undercut the honesty this
// whole rebuild has been careful about.
export function WorkSpotlight() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const featured = PROJECTS.find((project) => project.status === "live");

  useEffect(() => {
    if (reducedMotion || !featured) return;
    const scene = sceneRef.current;
    if (!scene) return;
    initGsap();

    const eyebrow = scene.querySelector("[data-spotlight-eyebrow]");
    const name = scene.querySelector("[data-spotlight-name]");
    const visual = scene.querySelector("[data-spotlight-visual]");
    const info = scene.querySelector("[data-spotlight-info]");
    const cta = scene.querySelector("[data-spotlight-cta]");

    const ctx = gsap.context(() => {
      gsap.set([eyebrow, name, info, cta], { opacity: 0, y: 20 });
      gsap.set(visual, { opacity: 0, scale: 0.88 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: scene, start: "top 75%", end: "bottom 60%", scrub: 0.5 },
      });

      tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.15, ease: GSAP_LIQUID_EASE }, 0)
        .to(name, { opacity: 1, y: 0, duration: 0.2, ease: GSAP_LIQUID_EASE }, 0.12)
        .to(visual, { opacity: 1, scale: 1, duration: 0.3, ease: GSAP_LIQUID_EASE }, 0.28)
        .to(info, { opacity: 1, y: 0, duration: 0.2, ease: GSAP_LIQUID_EASE }, 0.55)
        .to(cta, { opacity: 1, y: 0, duration: 0.15, ease: GSAP_LIQUID_EASE }, 0.8);
    }, scene);

    return () => ctx.revert();
  }, [reducedMotion, featured]);

  if (!featured) return null;

  return (
    <section className="px-6 py-32 max-w-[1600px] mx-auto">
      <Reveal>
        <h2
          className="font-display text-kov-bone uppercase max-w-2xl mb-16"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Chaque projet laisse une trace<span className="text-kov-red">.</span>
        </h2>
      </Reveal>

      <div ref={sceneRef} className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2">
          <p data-spotlight-eyebrow className="text-kov-red font-mono text-xs mb-4">
            Projet / {featured.id}
          </p>
          <p
            data-spotlight-name
            className="font-display text-kov-bone uppercase mb-8"
            style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
          >
            {featured.name}
          </p>
          <div data-spotlight-visual>
            <GlassCard interactive className="min-h-[360px] flex items-end p-8">
              <p className="text-kov-steel font-mono text-xs uppercase tracking-widest">
                Visuel à venir — étude de cas en préparation
              </p>
            </GlassCard>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div data-spotlight-info>
            <p className="text-kov-steel text-xs uppercase tracking-widest mb-6">{featured.category}</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {featured.tags.map((tag) => (
                <TagPill key={tag}>{tag}</TagPill>
              ))}
            </div>
          </div>
          <div data-spotlight-cta>
            {featured.caseStudyHref ? (
              <Link
                href={featured.caseStudyHref}
                className="text-kov-red text-xs uppercase tracking-widest hover:text-kov-red-signal transition-colors"
              >
                Voir l&apos;étude de cas →
              </Link>
            ) : (
              <span className="text-kov-steel text-xs uppercase tracking-widest">Étude de cas en préparation</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
