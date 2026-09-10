import Image from "next/image";
import type { ReactNode } from "react";
import { LegalSidebar } from "@/components/legal/LegalSidebar";

// Shared shell for the whole /legal hub (mentions, cgv, confidentialité,
// cookies, conditions d'utilisation, gestion des cookies) — the hero and
// sidebar render once here; only `children` (the document panel) swaps
// per route. No grid-line backdrop (LegalDoc's old GridParallaxBackdrop) —
// removed by request, not carried over into this redesign.
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen px-6 pt-40 pb-32">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_460px] gap-12 items-center">
          <div className="relative z-10">
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
              Transparence, conformité et confiance. Retrouvez ici l&apos;ensemble des informations relatives à notre
              activité, nos conditions générales et notre politique de confidentialité.
            </p>
          </div>

          {/* No card treatment — the photo bleeds straight into the page's
              own black instead of sitting in a bordered/rounded box. Only a
              bottom fade now (no left fade — it kept encroaching on the
              photo's real "KOV / DIGITAL EXPERIENCES / REAL IMPACT" wall
              signage, which starts around 20% in from the left edge). */}
          <div className="relative hidden md:block" style={{ aspectRatio: "4 / 5" }}>
            <Image
              src="/legal/hero-lobby.webp"
              alt="Le studio KOV"
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
              priority
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, var(--kov-black) 0%, transparent 35%)",
              }}
            />
          </div>
        </div>

        <div className="mt-20 grid lg:grid-cols-[300px_1fr] gap-10 lg:gap-14 items-start">
          <LegalSidebar />
          <div>{children}</div>
        </div>
      </div>
    </main>
  );
}
