import type { ReactNode } from "react";
import { LegalSidebar } from "@/components/legal/LegalSidebar";

// Shared shell for the whole /legal hub (mentions, cgv, confidentialité,
// cookies, conditions d'utilisation, gestion des cookies) — the hero and
// sidebar render once here; only `children` (the document panel) swaps
// per route. No grid-line backdrop (LegalDoc's old GridParallaxBackdrop) —
// removed by request, not carried over into this redesign. No hero photo
// either; a soft red wash is the only visual here.
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main id="kov-main" tabIndex={-1} className="relative min-h-screen pb-32">
      {/* Ambient backdrop for the whole /legal hub. Same `fixed` +
          `--z-canvas` placement as before: pinned to the viewport so it stays
          put behind every route's content as you scroll, and on a negative
          z-index so it never competes with the page's own stacking.

          This used to be LightPillar — a WebGL ribbon that brought the whole
          of Three.js with it, ~700 KB ahead of the text of the CGV. It is two
          radial gradients now. No canvas, no shader, no runtime cost at all,
          and nothing to fail on a weak GPU.

          Confined to the right half on desktop and anchored past the right
          edge, so it stays clear of the hero copy and the sidebar, which are
          both left-aligned. Two overlapping ellipses rather than one: a
          single radial reads as a flat coloured blob, an offset pair reads as
          depth. Alphas are deliberately low — 0.18 peak on a #0a0a0a ground
          is a glow you notice without ever reading it as a red panel.

          The rgba literals mirror --kov-red and --kov-red-signal; a gradient
          stop cannot take a hex custom property directly, same reason
          CursorGrid keeps its own copy of the red. */}
      <div
        aria-hidden="true"
        className="fixed inset-y-0 right-0 w-full md:w-[55%] pointer-events-none"
        style={{
          zIndex: "var(--z-canvas)",
          background:
            "radial-gradient(ellipse 70% 55% at 108% 26%, rgba(227, 30, 36, 0.18), transparent 68%)," +
            "radial-gradient(ellipse 46% 40% at 94% 76%, rgba(255, 77, 77, 0.07), transparent 70%)",
        }}
      />

      <div className="px-6">
        <div className="relative max-w-[1400px] mx-auto">
          <div className="pt-40">
            <div className="max-w-xl lg:max-w-2xl relative z-10">
              <p className="flex items-center gap-3 text-xs uppercase tracking-widest text-kov-steel">
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
                Légal
                <span aria-hidden="true" className="h-px flex-1 max-w-16" style={{ background: "var(--glass-border)" }} />
              </p>
              {/* Not an <h1>: this hero is shared by all six legal routes,
                  and each of those already has its own <h1> for its own
                  subject ("Conditions générales de vente", "Confidentialité"…).
                  Every one of them was shipping two. Same classes, same
                  pixels — only the tag changes. */}
              <p
                className="mt-6 font-display text-kov-bone uppercase"
                style={{ fontSize: "clamp(36px, 5.5vw, 72px)", lineHeight: "var(--line-height-display)" }}
              >
                Informations
                <br />
                <span className="text-kov-red">légales</span>
              </p>
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
