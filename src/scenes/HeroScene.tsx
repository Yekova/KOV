import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import ShapeBlur from "@/components/ui/ShapeBlur";

const GLASS_PILL_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
} as const;

// Second pass on a reference the user shared (Circular's landing page):
// centered layout, a black/glass bar enclosing the nav at the top, no
// particle interactivity, a single halo-bordered CTA. Structural choices
// that differ from a literal copy:
//
// - The reference's nav sits INSIDE its frame because that frame is a flat
//   opaque black rectangle. Nav.tsx is a genuinely sitewide fixed element
//   (same component on every page), so instead of moving it into this
//   component's DOM, the frame here is flush with the viewport edges (no
//   margin, unlike the first pass) and carries its own translucent glass
//   strip at the top — Nav's already-fixed pill then visually reads as
//   "inside" that strip without any architectural coupling between the two.
//   Nav's home-page transparent-pill variant was dropped for the same
//   reason: an invisible pill can't look "enclosed" by anything.
// - ShapeBlur (previously the framing effect on HeroContactCard, now
//   removed per this round's request) is reused on the CTA button instead —
//   same component, new host, roundness re-tuned for a pill instead of a
//   card (see ShapeBlur.tsx's own VAR==0 comment for the underlying SDF
//   math this was derived from).
// - No particle field: `next/image` renders the same character-free
//   Accueil-menu photo (atrium-brutaliste.jpg) as a plain static cover
//   background, so the gradient scrim only has to counteract one fixed
//   frame, not a continuously-swirling one.
export function HeroScene() {
  return (
    <section id="hero" className="relative min-h-screen">
      <div
        className="absolute inset-0 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border"
        style={{ borderColor: "var(--glass-border)" }}
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

        {/* Liquid-glass strip enclosing the fixed Nav pill — Nav itself
            renders outside this component's tree, this only supplies the
            visual container it floats inside. */}
        <div
          className="absolute top-0 inset-x-0 h-20 md:h-24 border-b"
          style={{ zIndex: "var(--z-glass)", ...GLASS_PILL_STYLE }}
        />

        <div
          className="relative h-full flex flex-col items-center justify-center text-center px-6"
          style={{ zIndex: "var(--z-content)" }}
        >
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
              style={{ fontSize: "clamp(40px, 9vw, 160px)", lineHeight: "var(--line-height-display)" }}
            >
              CONSTRUIRE VITE
              <br />
              SANS RIEN <span className="italic text-kov-red">CASSER</span>
              <span className="text-kov-red">.</span>
            </h1>
          </Reveal>

          <Reveal variant="fade" delay={0.3}>
            <p className="mt-8 max-w-lg mx-auto text-kov-concrete text-sm leading-relaxed">
              Design, développement et motion pensés comme un seul système —
              pas trois prestataires qui se renvoient la responsabilité.
            </p>
          </Reveal>

          <Reveal variant="fade" delay={0.45}>
            <div className="relative mt-10 inline-block">
              <div className="absolute -inset-3 pointer-events-none">
                <ShapeBlur
                  variation={0}
                  shapeSize={1.7}
                  roundness={1.7}
                  borderSize={0.08}
                  circleSize={0.5}
                  circleEdge={1}
                  color="#E31E24"
                />
              </div>
              <Link
                href="/contact"
                className="relative inline-flex items-center gap-2 px-8 py-4 border text-kov-bone text-xs uppercase tracking-widest hover:text-kov-red transition-colors"
                style={{ ...GLASS_PILL_STYLE, borderRadius: "var(--radius-pill)" }}
              >
                Démarrer un projet →
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
