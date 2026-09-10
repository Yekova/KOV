import Image from "next/image";
import type { ReactNode } from "react";
import { LegalSidebar } from "@/components/legal/LegalSidebar";

// Shared shell for the whole /legal hub (mentions, cgv, confidentialité,
// cookies, conditions d'utilisation, gestion des cookies) — the hero and
// sidebar render once here; only `children` (the document panel) swaps
// per route. No grid-line backdrop (LegalDoc's old GridParallaxBackdrop) —
// removed by request, not carried over into this redesign.
// Reference disposition: the hero photo bleeds all the way to the top of
// the page (behind the fixed Nav, which sits at a higher z-index — see
// Nav.tsx's `--z-nav` — so it stays on top with no stacking conflict) and
// runs flush to this container's own right edge — no inset gap on any
// side, which is what was reading as a bordered/framed card. Its height
// is also deliberately taller than the gap before the sidebar row below,
// so it overflows past the hero section and its bottom edge overlaps the
// very top of that row — plain CSS stacking already puts an absolutely
// positioned element like this one above the static content below it, no
// z-index needed, which is exactly the "dépasse" effect being asked for.
const HERO_PHOTO_WIDTH = 480;
const HERO_PHOTO_HEIGHT = 640;

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen pb-32">
      <div className="px-6">
        <div className="relative max-w-[1400px] mx-auto">
          <div
            className="absolute top-0 right-0 hidden md:block overflow-hidden"
            style={{ width: HERO_PHOTO_WIDTH, height: HERO_PHOTO_HEIGHT }}
          >
            <Image
              src="/legal/hero-lobby.webp"
              alt="Le studio KOV"
              fill
              sizes={`${HERO_PHOTO_WIDTH}px`}
              className="object-cover object-left-top"
              priority
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to top, var(--kov-black) 0%, transparent 40%)" }}
            />
            {/* Caption sits inset over the photo's own bottom-left corner
                (on top of the fade, so it stays legible) instead of in a
                side gutter — that gutter was the other piece of the boxed,
                "card" look, on top of it not needing its own dead space. */}
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
