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
      {/* Ambient backdrop for the whole /legal hub — same `fixed inset-0` +
          `--z-canvas` pattern as LineWaves on the homepage (src/app/page.tsx):
          pinned to the viewport so it stays behind every route's content as
          you scroll. `--z-canvas` is a negative z-index specifically so it
          never fights the actual page content's own stacking, only the root
          background. Red/pink duo per spec (topColor/bottomColor) — not a
          brand-red-only treatment. pillarWidth/pillarHeight scaled down from
          the corner version (2.6/0.45 → 1.3/0.3) so the raymarch reads as a
          smaller, contained column instead of a wide glow that saturates
          into one color, which is what actually reveals the gradient. */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: "var(--z-canvas)" }}>
        <LightPillar
          topColor="#ff0000"
          bottomColor="#FF9FFC"
          intensity={0.85}
          rotationSpeed={0.12}
          glowAmount={0.005}
          pillarWidth={1.3}
          pillarHeight={0.3}
          noiseIntensity={0.4}
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
