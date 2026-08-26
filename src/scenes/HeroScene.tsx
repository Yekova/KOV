import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { ParticleImage } from "@/components/home/ParticleImage";
import { HeroContactCard } from "@/components/home/HeroContactCard";

// Framed "liquid glass" treatment, inspired by a reference the user pasted
// (Circular's landing page: a big rounded-corner black-bordered panel inset
// from the viewport edge, floating nav on top). KOV's page background is
// already near-black, so a literal pure-black border wouldn't read as a
// border at all — the frame here is the same structural idea (inset margin,
// large rounded corners, overflow-hidden, a visible border stroke, an
// elevation shadow) built from KOV's own tokens (`--kov-border` for the
// stroke) rather than copying the reference's literal light-on-black
// contrast, which only works because ITS page background is white.
//
// Nav and GlobalMenuButton are both sitewide fixed-position elements
// rendered outside this component's subtree (SiteChrome/Nav.tsx), so they
// float above the frame unaffected by its own overflow-hidden clipping —
// nothing here needs to reach out and reposition them.
//
// The particle background (position: absolute, painted first) and this
// content wrapper (position: relative, z-content) are sibling stacking
// contexts, so the whole wrapper paints above the whole background
// regardless of what's static inside it. A gradient scrim sits between the
// two, since particles swirl and disperse continuously — without it, a
// bright cluster could pass directly behind the headline and hurt
// legibility at any given moment.
export function HeroScene() {
  return (
    <section id="hero" className="relative min-h-screen">
      <div
        className="absolute inset-3 md:inset-4 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border"
        style={{ borderColor: "var(--kov-border)", boxShadow: "0 40px 100px rgba(0, 0, 0, 0.6)" }}
      >
        <ParticleImage src="/kov/menu/atrium-brutaliste.jpg" />
        <div
          className="absolute inset-0"
          style={{
            zIndex: "var(--z-atmosphere)",
            background:
              "linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.55) 55%, rgba(10,10,10,0.85) 100%)",
          }}
        />

        <div
          className="relative flex flex-col justify-between h-full px-6 py-16 md:py-20 max-w-[1600px] mx-auto"
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

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10">
            <div className="flex-1">
              <Reveal variant="blur">
                <h1
                  className="font-display text-kov-bone uppercase"
                  style={{ fontSize: "clamp(40px, 9vw, 160px)", lineHeight: "var(--line-height-display)" }}
                >
                  CONSTRUIRE VITE
                  <br />
                  SANS RIEN <span className="italic text-kov-red">CASSER</span>
                  <span className="text-kov-red">.</span>
                </h1>
              </Reveal>

              <Reveal variant="fade" delay={0.25}>
                <p className="mt-8 max-w-lg text-kov-concrete text-sm leading-relaxed">
                  Design, développement et motion pensés comme un seul système —
                  pas trois prestataires qui se renvoient la responsabilité.
                </p>
              </Reveal>
            </div>

            <Reveal variant="fade" delay={0.5} className="hidden lg:block shrink-0">
              <HeroContactCard />
            </Reveal>
          </div>

          <Reveal variant="fade" delay={0.5}>
            <p className="text-xs uppercase tracking-widest text-kov-steel">Design / Développement / Motion</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
