import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { ParticleImage } from "@/components/home/ParticleImage";
import { HeroContactCard } from "@/components/home/HeroContactCard";

// The former video-backed cinematic intro is gone; the section is back in
// normal document flow (no more scroll-scrub coupling to src/data/scenes.ts,
// which no longer exists). One positioning boundary matters here: the
// particle background (position: absolute, z-canvas) and this content
// wrapper (position: relative, z-content) are sibling stacking contexts, so
// the whole wrapper paints above the whole background regardless of what's
// static inside it — no need to position every child individually. A
// gradient scrim sits between the two, since particles swirl and disperse
// continuously — without it, a bright cluster could pass directly behind
// the headline and hurt legibility at any given moment.
export function HeroScene() {
  return (
    <section id="hero" className="relative min-h-screen overflow-hidden">
      <ParticleImage src="/kov/home/particle-source.jpg" />
      <div
        className="absolute inset-0"
        style={{
          zIndex: "var(--z-atmosphere)",
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.55) 55%, rgba(10,10,10,0.85) 100%)",
        }}
      />

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

          <div className="mt-8 flex flex-col lg:flex-row lg:items-start justify-between gap-10">
            <div className="flex-1 max-w-lg">
              <Reveal variant="fade" delay={0.25}>
                <p className="text-kov-concrete text-sm leading-relaxed">
                  Design, développement et motion pensés comme un seul système —
                  pas trois prestataires qui se renvoient la responsabilité. On
                  construit des sites et des plateformes qui durent, pas des
                  maquettes qui s&apos;arrêtent à la livraison.
                </p>
              </Reveal>
            </div>

            <Reveal variant="fade" delay={0.5} className="hidden lg:block shrink-0">
              <HeroContactCard />
            </Reveal>
          </div>
        </div>

        <Reveal variant="fade" delay={0.5}>
          <p className="text-xs uppercase tracking-widest text-kov-steel">Design / Développement / Motion</p>
        </Reveal>
      </div>
    </section>
  );
}
