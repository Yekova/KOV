"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PILLARS } from "@/data/expertisePillars";
import { FluidGlassCards } from "@/components/ui/FluidGlassCards";

const EXPERTISE_PHOTO = "/kov/menu/bureau-moderne.jpg";

// Second pass, replacing the earlier pinned "chips converge into a glass
// orb" scroll scene (too abstract — the payoff read as decoration, not as
// KOV's actual space or the character who guides the site). This version
// is a real composed scene instead: the studio photo as a background, the
// KOV character standing to one side (docs/KOV-CHARACTER.md's own brief
// for this section — "Expertises: il révèle plusieurs layers"), and real
// text on real glass cards on the other side, each card a genuine WebGL
// refraction (FluidGlassCards) of that same photo rather than a CSS blur
// trick. Below it (always in normal flow) the same six pillars still
// render as a plain, fully readable grid with their real body copy — that
// stays the "information" beat and the reduced-motion/no-JS fallback,
// unchanged from before.
//
// Reduced motion drops the Canvas (no motion happens there anyway, but a
// continuous WebGL render loop still isn't free) and falls back to the
// text sitting directly on the photo — still fully legible thanks to the
// same gradient overlay, just without the glass panels.
export function ExpertiseTeaser() {
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  return (
    <section id="expertise" className="px-6 max-w-[1600px] mx-auto scroll-mt-24">
      <div className="py-32">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Expertise</p>
          <h2
            className="font-display text-kov-bone uppercase max-w-3xl"
            style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
          >
            Six disciplines<span className="text-kov-red">.</span> Un seul système<span className="text-kov-red">.</span>
          </h2>
          <p className="mt-6 max-w-xl text-kov-concrete text-sm leading-relaxed">
            Stratégie, design, développement, motion, systèmes et intégration ne
            sont pas six prestations séparées. Chez KOV, elles sont pensées
            ensemble, de la première décision jusqu&apos;à la mise en ligne — puis à
            l&apos;évolution du produit. Chaque discipline nourrit la suivante ;
            aucune ne travaille en vase clos.
          </p>
        </Reveal>
      </div>

      <Reveal variant="blur">
        <div className="relative overflow-hidden" style={{ borderRadius: "var(--radius-glass)" }}>
          <Image src={EXPERTISE_PHOTO} alt="" aria-hidden="true" fill sizes="100vw" className="object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.25) 35%, rgba(10,10,10,0.7) 100%), linear-gradient(0deg, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.1) 40%)",
            }}
          />

          <div className="relative flex flex-col md:flex-row min-h-[520px] md:min-h-[620px]">
            <div className="hidden md:flex items-end justify-center w-[34%] shrink-0 px-4 pointer-events-none">
              <Image
                src="/kov/character/assistant-portrait-transparent.png"
                alt=""
                aria-hidden="true"
                width={621}
                height={1007}
                className="h-[92%] w-auto"
              />
            </div>

            <div className="relative flex-1 min-h-[420px] md:min-h-0">
              {!reducedMotion && (
                <FluidGlassCards count={PILLARS.length} texture={EXPERTISE_PHOTO} className="absolute inset-0" />
              )}
              <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 p-3 md:p-6" style={{ gridAutoRows: "1fr" }}>
                {PILLARS.map((pillar) => (
                  <div key={pillar.slug} className="relative flex flex-col justify-end p-2 md:p-3">
                    {/* Text-safe scrim, independent of whatever the glass card
                        happens to be refracting underneath — legibility can't
                        depend on the WebGL content staying dark at that spot. */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(0deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0) 70%)" }}
                    />
                    <p className="relative text-kov-red font-mono text-[10px] md:text-xs">{pillar.number}</p>
                    <p className="relative font-display text-kov-bone uppercase text-xs md:text-sm leading-tight">{pillar.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="py-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 border-t pt-10" style={{ borderColor: "var(--kov-border)" }}>
          {PILLARS.map((pillar, index) => (
            <Reveal key={pillar.slug} delay={0.1 + index * 0.06}>
              <p className="text-kov-red font-mono text-xs mb-3">{pillar.number}</p>
              <h3 className="font-display text-kov-bone uppercase text-xl mb-2">{pillar.title}</h3>
              <p className="text-kov-concrete text-sm leading-relaxed">{pillar.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <Button href="/expertise" variant="secondary" className="mt-16">
            Voir l&apos;expertise →
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
