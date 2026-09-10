import type { ReactNode } from "react";
import { LegalSidebar } from "@/components/legal/LegalSidebar";
import LightPillar from "@/components/legal/LightPillar";

// Shared shell for the whole /legal hub (mentions, cgv, confidentialité,
// cookies, conditions d'utilisation, gestion des cookies) — the hero and
// sidebar render once here; only `children` (the document panel) swaps
// per route. No grid-line backdrop (LegalDoc's old GridParallaxBackdrop) —
// removed by request, not carried over into this redesign.
// Disposition: the hero glow bleeds all the way to the top of the page
// (behind the fixed Nav, which sits at a higher z-index — see Nav.tsx's
// `--z-nav` — so it stays on top with no stacking conflict) and runs
// flush to this container's own right edge — no inset gap on any side,
// which is what a boxed/framed photo was reading as before it was swapped
// for this effect. Its height is also deliberately taller than the gap
// before the sidebar row below, so it overflows past the hero section and
// its bottom edge overlaps the very top of that row — plain CSS stacking
// already puts an absolutely positioned element like this one above the
// static content below it, no z-index needed for that overlap.
const HERO_GLOW_WIDTH = 480;
const HERO_GLOW_HEIGHT = 640;

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen pb-32">
      <div className="px-6">
        <div className="relative max-w-[1400px] mx-auto">
          <div
            className="absolute top-0 right-0 hidden md:block overflow-hidden"
            style={{ width: HERO_GLOW_WIDTH, height: HERO_GLOW_HEIGHT }}
          >
            {/* --kov-red as the top color, fading to near-black — keeps the
                glow inside the site's own red/black palette rather than
                the component's stock violet/pink defaults. screen blend
                mode is what makes it merge into the black page instead of
                sitting in a visible box (the actual fix for "no bordures"). */}
            <LightPillar
              topColor="#e31e24"
              bottomColor="#1a0505"
              intensity={1.1}
              rotationSpeed={0.15}
              glowAmount={0.006}
              pillarWidth={2.4}
              pillarHeight={0.5}
              noiseIntensity={0.4}
              quality="medium"
              mixBlendMode="screen"
            />
            {/* Caption sits inset over the glow's own bottom-left corner —
                same placement used when this box held the hero photo. */}
            <p className="absolute left-6 bottom-6 text-[10px] uppercase tracking-widest text-kov-steel leading-relaxed">
              Des expériences
              <br />
              qui vont plus loin
            </p>
          </div>

          <div className="pt-40">
            <div className="max-w-xl lg:max-w-2xl relative z-10">
              <p className="flex items-center gap-3 text-xs uppercase tracking-widest text-kov-steel">
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
                Légal
                <span aria-hidden="true" className="h-px flex-1 max-w-16" style={{ background: "var(--glass-border)" }} />
              </p>
              <h1
                className="mt-6 font-display text-kov-bone uppercase"
                style={{ fontSize: "clamp(36px, 5.5vw, 72px)", lineHeight: "var(--line-height-display)" }}
              >
                Informations
                <br />
                <span className="text-kov-red">légales</span>
              </h1>
              <p className="mt-6 max-w-lg text-kov-steel text-sm leading-relaxed">
                Transparence, conformité et confiance. Retrouvez ici l&apos;ensemble des informations relatives à
                notre activité, nos conditions générales et notre politique de confidentialité.
              </p>
            </div>

            <div className="mt-20 grid lg:grid-cols-[300px_1fr] gap-10 lg:gap-14 items-start">
              <LegalSidebar />
              <div>{children}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
