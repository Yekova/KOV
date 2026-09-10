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
// Nav.tsx's `--z-nav` — so it stays on top with no stacking conflict),
// taller than the text block beside it, with a small caption sitting in
// the margin to its right. That means the photo can't just be a normal
// grid cell sized off `pt-40` like the text column — it's pulled out to
// `absolute`, anchored to this section's own top-left origin, so its own
// height is independent of the padding applied to the text underneath it.
const HERO_PHOTO_WIDTH = 420;
const HERO_PHOTO_HEIGHT = 560;

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen pb-32">
      <div className="px-6">
        <div className="relative max-w-[1400px] mx-auto">
          <div
            className="absolute top-0 right-[130px] hidden md:block overflow-hidden"
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
              style={{ background: "linear-gradient(to top, var(--kov-black) 0%, transparent 30%)" }}
            />
          </div>

          <div
            className="absolute hidden lg:flex flex-col justify-end text-right"
            style={{ top: HERO_PHOTO_HEIGHT - 90, right: 0, width: 110, height: 90 }}
          >
            <p className="text-[10px] uppercase tracking-widest text-kov-steel leading-relaxed">
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
