import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import ShapeBlur from "@/components/ui/ShapeBlur";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";

const GLASS_PILL_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
} as const;

// Third pass, matching a reference (Circular's landing) more literally, per
// explicit follow-up feedback: the previous version only LOOKED like Nav and
// the global-menu button sat inside the frame (they were still fixed to the
// viewport, just visually overlapping it). This time they're genuine DOM
// descendants of the frame below, positioned absolute against it —
// SiteChrome skips rendering its own fixed instances on "/" specifically so
// there's only ever one of each (see SiteChrome.tsx and
// GlobalMenuContext.tsx, which lets the button here and the full-screen
// overview modal — still rendered from SiteChrome, since it's a portal that
// doesn't care where it's mounted — share open/close state without prop
// drilling through the page tree).
//
// Structure = the reference (frame encloses nav + content + menu button,
// content is centered and width-constrained, one compact halo-bordered CTA).
// Identity = KOV's own (near-black glass, condensed uppercase display type,
// red accent, the existing Nav/GlobalMenuButton components untouched apart
// from a position-only "contained" variant — not a redesign of either).
export function HeroScene() {
  return (
    <section id="hero" className="relative min-h-screen">
      <div
        className="absolute inset-4 md:inset-6 overflow-hidden rounded-[28px] md:rounded-[32px] border-2"
        style={{
          borderColor: "rgba(255, 255, 255, 0.28)",
          boxShadow: "0 30px 90px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        }}
      >
        <Image
          src="/kov/menu/atrium-brutaliste.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        <div
          className="absolute inset-0"
          style={{
            zIndex: "var(--z-atmosphere)",
            background:
              "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.35) 30%, rgba(10,10,10,0.55) 65%, rgba(10,10,10,0.9) 100%)",
          }}
        />

        {/* Glass strip so the header region reads as visibly part of the
            frame — Nav itself stays the same floating pill (unchanged
            component), this only supplies a bounded zone for it to sit in.
            Rounds automatically with the frame's own top corners, since it's
            clipped by the parent's overflow-hidden. */}
        <div
          className="absolute top-0 inset-x-0 h-24 md:h-28 border-b"
          style={{
            zIndex: "var(--z-glass)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            borderColor: "rgba(255, 255, 255, 0.14)",
          }}
        />

        {/* Same idea at the bottom, for the global-menu button. */}
        <div
          className="absolute bottom-0 inset-x-0 h-24 md:h-28 border-t"
          style={{
            zIndex: "var(--z-glass)",
            background: "linear-gradient(0deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            borderColor: "rgba(255, 255, 255, 0.14)",
          }}
        />

        <Nav variant="contained" />

        <div
          className="relative h-full flex flex-col items-center justify-center text-center px-6"
          style={{ zIndex: "var(--z-content)" }}
        >
          <div className="max-w-5xl mx-auto flex flex-col items-center">
            <Reveal variant="fade">
              <span
                className="inline-flex items-center px-4 py-2 border text-xs uppercase tracking-widest text-kov-bone"
                style={{ ...GLASS_PILL_STYLE, borderRadius: "var(--radius-pill)" }}
              >
                Studio digital — Bordeaux, France
              </span>
            </Reveal>

            <Reveal variant="blur" delay={0.15}>
              <h1
                className="mt-8 font-display text-kov-bone uppercase"
                style={{ fontSize: "clamp(32px, 6vw, 100px)", lineHeight: "var(--line-height-display)" }}
              >
                CONSTRUIRE VITE
                <br />
                SANS RIEN <span className="text-kov-red">CASSER</span>
                <span className="text-kov-red">.</span>
              </h1>
            </Reveal>

            <Reveal variant="fade" delay={0.3}>
              <p className="mt-8 max-w-md mx-auto text-kov-concrete text-sm leading-relaxed">
                Design, développement et motion pensés comme un seul système —
                pas trois prestataires qui se renvoient la responsabilité.
              </p>
            </Reveal>

            <Reveal variant="fade" delay={0.45}>
              <div className="relative mt-10 inline-block">
                <div className="absolute -inset-1.5 pointer-events-none">
                  <ShapeBlur
                    variation={0}
                    shapeSize={1.55}
                    roundness={1.5}
                    borderSize={0.05}
                    circleSize={0.45}
                    circleEdge={0.8}
                    color="#E31E24"
                  />
                </div>
                <Link
                  href="/contact"
                  className="relative inline-flex items-center gap-2 px-6 py-3 border text-kov-bone text-xs uppercase tracking-widest hover:text-kov-red transition-colors"
                  style={{ ...GLASS_PILL_STYLE, borderRadius: "var(--radius-pill)" }}
                >
                  Démarrer un projet →
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        <HeroGlobalMenuButton />
      </div>
    </section>
  );
}
