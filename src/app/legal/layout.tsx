import type { ReactNode } from "react";
import { LegalSidebar } from "@/components/legal/LegalSidebar";
import LightPillar from "@/components/legal/LightPillar";

// Shared shell for the whole /legal hub (mentions, cgv, confidentialité,
// cookies, conditions d'utilisation, gestion des cookies) — the hero and
// sidebar render once here; only `children` (the document panel) swaps
// per route. No grid-line backdrop (LegalDoc's old GridParallaxBackdrop) —
// removed by request, not carried over into this redesign. No hero photo
// either now — LightPillar's ambient glow is the only visual here.
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen pb-32">
      {/* Ambient backdrop for the whole /legal hub — same `fixed` +
          `--z-canvas` pattern as LineWaves on the homepage (src/app/page.tsx):
          pinned to the viewport so it stays behind every route's content as
          you scroll. `--z-canvas` is a negative z-index specifically so it
          never fights the actual page content's own stacking, only the root
          background. Confined to the right half on desktop (md:) rather
          than the full width, so it never sits directly behind the text
          column on the left — the previous full-bleed version fought that
          text for attention. Props reverted to the spec's own example
          values (pillarWidth 3.0, pillarHeight 0.4, glowAmount 0.005,
          intensity 1.0) — an earlier pass shrank pillarWidth/intensity to
          try to "reveal both colors", which instead made the shape read as
          too zoomed-in; the example's own values are what actually produce
          the recognizable ribbon shape shown in reactbits.dev's own demo. */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[55%] pointer-events-none" style={{ zIndex: "var(--z-canvas)" }}>
        <LightPillar
          topColor="#ff0000"
          bottomColor="#FF9FFC"
          intensity={1.0}
          rotationSpeed={0.3}
          glowAmount={0.005}
          pillarWidth={3.0}
          pillarHeight={0.4}
          noiseIntensity={0.5}
          quality="medium"
          mixBlendMode="screen"
        />
      </div>

      <div className="px-6">
        <div className="relative max-w-[1400px] mx-auto">
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
