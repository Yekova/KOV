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

// Fourth pass: the bordered-frame concept (previous 3 rounds) is dropped —
// back to a full-bleed section, no inset/radius/border, no glass header or
// footer strip. Nav and the global-menu button stay genuine DOM descendants
// of this section (position: absolute against it) rather than reverting to
// SiteChrome's fixed instances — that part of the earlier work is kept, it
// was never the "borders" being objected to. See SiteChrome.tsx and
// GlobalMenuContext.tsx for how the two positioning variants share state.
export function HeroScene() {
  return (
    <section id="hero" className="relative min-h-screen overflow-hidden">
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

      <Nav variant="contained" />

      <div
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6"
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
              DES SITES WEB
              <br />
              QUI TIENNENT<span className="text-kov-red">.</span>
            </h1>
          </Reveal>

          <Reveal variant="fade" delay={0.3}>
            <p className="mt-8 max-w-md mx-auto text-kov-concrete text-sm leading-relaxed">
              Design, développement et motion pensés comme un seul système —
              pas trois prestataires qui se renvoient la responsabilité.
            </p>
          </Reveal>

          <Reveal variant="fade" delay={0.45}>
            {/* group + group-hover drives the halo's reveal: ShapeBlur's own
                canvas already tracks the cursor continuously (see its file
                for why — a global pointermove listener, not a hover check),
                so the discrete "hover" requested here is layered on top as a
                plain CSS opacity transition rather than touching the effect
                itself. */}
            <div className="group relative mt-10 inline-block">
              <div className="absolute -inset-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ShapeBlur
                  variation={0}
                  shapeSize={1.6}
                  roundness={1.55}
                  borderSize={0.07}
                  circleSize={0.55}
                  circleEdge={1}
                  color="#E31E24"
                />
              </div>
              <Link
                href="/contact"
                className="relative inline-flex items-center gap-2 px-6 py-3 border text-kov-bone text-xs uppercase tracking-widest group-hover:text-kov-red transition-colors"
                style={{ ...GLASS_PILL_STYLE, borderRadius: "var(--radius-pill)" }}
              >
                Démarrer un projet →
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      <HeroGlobalMenuButton />
    </section>
  );
}
