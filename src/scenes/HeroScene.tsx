import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ArchitecturalGrid } from "@/components/home/ArchitecturalGrid";

// The former video-backed cinematic intro is gone — ArchitecturalGrid replaces
// it as ambient texture, and the section is back in normal document flow (no
// more scroll-scrub coupling to src/data/scenes.ts, which no longer exists).
// One positioning boundary matters here: the grid (position: absolute,
// z-canvas) and this content wrapper (position: relative, z-content) are
// sibling stacking contexts, so the whole wrapper paints above the whole
// grid regardless of what's static inside it — no need to position every
// child individually.
export function HeroScene() {
  return (
    <section id="hero" className="relative min-h-screen overflow-hidden">
      <ArchitecturalGrid />

      <div
        className="relative flex flex-col justify-between min-h-screen px-6 py-24 md:py-32 max-w-[1600px] mx-auto"
        style={{ zIndex: "var(--z-content)" }}
      >
        <Reveal variant="fade">
          <div className="flex flex-col items-start gap-3">
            <Image
              src="/kov/brand/kov-wordmark-bone.png"
              alt="KOV"
              width={1116}
              height={209}
              priority
              className="h-7 md:h-9 w-auto"
            />
            <p className="font-sans normal-case text-xs tracking-widest text-kov-steel">
              Studio digital — Bordeaux, France
            </p>
          </div>
        </Reveal>

        <div>
          <Reveal variant="blur">
            <h1
              className="font-display text-kov-bone uppercase max-w-[85%]"
              style={{ fontSize: "var(--display-xl)", lineHeight: "var(--line-height-display)" }}
            >
              DES SYSTÈMES
              <br />
              QUI TIENNENT<span className="text-kov-red">.</span>
            </h1>
          </Reveal>

          <Reveal variant="fade" delay={0.25}>
            <p className="mt-8 max-w-lg text-kov-concrete text-sm leading-relaxed">
              Design, développement et motion pensés comme un seul système —
              pas trois prestataires qui se renvoient la responsabilité. On
              construit des sites et des plateformes qui durent, pas des
              maquettes qui s&apos;arrêtent à la livraison.
            </p>
          </Reveal>

          <Reveal variant="fade" delay={0.4}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button href="/contact" variant="primary">
                Démarrer un projet →
              </Button>
              <Button href="/#work-gallery" variant="secondary">
                Voir les projets
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal variant="fade" delay={0.5}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 text-xs uppercase tracking-widest text-kov-steel">
            <p>Design / Développement / Motion</p>
            <Link href="/studio" className="hover:text-kov-red transition-colors">
              Découvrir le studio →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
