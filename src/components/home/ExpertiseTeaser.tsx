"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PILLARS } from "@/data/expertisePillars";

// Defers @react-three/fiber+drei+maath+three out of the homepage's initial
// bundle — already gated behind reducedMotion below, so most visits never
// need this chunk at all, and the ones that do only need it once this
// section scrolls into view.
const FluidGlassCursor = dynamic(() => import("@/components/ui/FluidGlassCursor").then((m) => m.FluidGlassCursor), { ssr: false });

const EXPERTISE_PHOTO = "/kov/menu/bureau-moderne.jpg";
const CARD_SLOT_HEIGHT = "140vh";

// Fourth pass. First was a pinned "chips converge into a glass orb" scroll
// scene — too abstract, no real photo/character. Second baked the glass
// refraction into each of the six pillar cards individually — rejected:
// the effect belonged on the cursor, not static content. Third put ONE
// lens on the cursor over a static panel with number+title-only cards —
// rejected again: the section needed real dwell time (longer, sticky
// cards) and the actual description text, and the lens needed to sit
// UNDER the cards rather than on top of everything.
//
// This version: the backdrop (photo + character + lens) and the six
// pillar cards are siblings sharing one CSS Grid cell (`gridColumn:
// gridRow: "1"`), so the backdrop's `position: sticky` keeps it pinned to
// the viewport for the entire scroll range while the cards — each in its
// own tall slot, individually sticky — stack up and hand off one at a
// time in front of it. Later cards are later in DOM order, so they
// naturally paint over earlier ones without needing z-index; the lens,
// part of the backdrop, paints first and so always sits under whichever
// card is currently in view. Full body copy now lives on the cards
// themselves, so the old separate "plain grid with body copy" fallback
// below is gone — it would just be duplicating this content.
//
// Not wrapped in <Reveal>: Reveal applies a CSS transform during its
// entrance transition, and ANY transform on an ancestor (even
// translateY(0) once "visible" — it's still a non-none transform value)
// creates a new containing block that breaks `position: sticky` for every
// descendant. The individual cards still don't need their own entrance
// animation; scrolling them into their sticky position already reads as
// the reveal.
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

      <div style={{ display: "grid" }}>
        <div
          className="sticky top-0 h-screen overflow-hidden self-start"
          style={{ gridColumn: "1", gridRow: "1", borderRadius: "var(--radius-glass)" }}
        >
          <Image src={EXPERTISE_PHOTO} alt="" aria-hidden="true" fill sizes="100vw" className="object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.25) 35%, rgba(10,10,10,0.7) 100%), linear-gradient(0deg, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.1) 40%)",
            }}
          />

          {!reducedMotion && <FluidGlassCursor texture={EXPERTISE_PHOTO} className="absolute inset-0" />}

          <div className="hidden md:flex absolute inset-y-0 left-0 items-end justify-center w-[34%] px-4 pointer-events-none">
            <Image
              src="/kov/character/assistant-portrait-transparent.png"
              alt=""
              aria-hidden="true"
              width={621}
              height={1007}
              className="h-[92%] w-auto"
            />
          </div>
        </div>

        <div style={{ gridColumn: "1", gridRow: "1" }}>
          {PILLARS.map((pillar) => (
            <div key={pillar.slug} style={{ height: CARD_SLOT_HEIGHT }}>
              <div
                className="sticky top-0 h-screen flex items-center justify-end px-6 md:px-16"
                style={{ pointerEvents: "none" }}
              >
                <div
                  className="border p-8 md:p-12 max-w-lg"
                  style={{
                    pointerEvents: "auto",
                    background: "var(--glass-bg)",
                    backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                    WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                    borderColor: "var(--glass-border)",
                    borderRadius: "var(--radius-glass)",
                    boxShadow: "var(--glass-shadow-full)",
                  }}
                >
                  <p className="text-kov-red font-mono text-xs mb-4">{pillar.number}</p>
                  <h3
                    className="font-display text-kov-bone uppercase mb-4"
                    style={{ fontSize: "clamp(24px, 3.5vw, 40px)", lineHeight: "var(--line-height-display)" }}
                  >
                    {pillar.title}
                  </h3>
                  <p className="text-kov-concrete text-sm md:text-base leading-relaxed">{pillar.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="py-32">
        <Reveal>
          <Button href="/expertise" variant="secondary">
            Voir l&apos;expertise →
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
