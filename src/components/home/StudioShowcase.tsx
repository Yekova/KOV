"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

const FEATURES = [
  "Visite interactive à 360°, navigable à la souris ou au doigt",
  "Aucune app à installer — un lien, ouvert dans n'importe quel navigateur",
  "Hébergée sur votre site ou sur le nôtre, selon votre projet",
];

// Right after Expertise — the KOV Virtual Studio (src/app/studio) is real,
// already built and live, not a mockup: this section pitches it as a
// service (immersive 360° tours of a real physical space) using the
// Studio's own entry-room photo as proof, not a fabricated CGI render.
export function StudioShowcase() {
  return (
    <section id="studio-showcase" className="px-6 py-32 max-w-[1600px] mx-auto">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-kov-steel">Studio virtuel</p>
          <h2
            className="mt-4 font-display text-kov-bone uppercase"
            style={{ fontSize: "clamp(28px, 3.6vw, 52px)", lineHeight: "var(--line-height-display)" }}
          >
            Vos espaces,
            <br />
            en <span className="text-kov-red">360°</span>.
          </h2>
          <p className="mt-6 text-kov-steel text-sm leading-relaxed max-w-md">
            On construit le même type d&apos;expérience immersive que celle-ci pour vos propres espaces : un lieu
            réel, capturé en 360° et transformé en visite interactive, navigable et mémorable — pour une agence,
            une boutique, un bien à visiter à distance.
          </p>

          <ul className="mt-8 space-y-3 max-w-md">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-kov-concrete text-sm leading-relaxed">
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-kov-red" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-start gap-3">
            <Button variant="primary" href="/studio">
              Explorer le studio →
            </Button>
            <Button variant="secondary" href="/contact">
              Discuter d&apos;un projet
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Link
            href="/studio"
            className="group relative block overflow-hidden"
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--kov-border)",
              boxShadow: "0 40px 90px rgba(0, 0, 0, 0.55)",
            }}
          >
            <div className="relative w-full" style={{ aspectRatio: "16 / 10" }}>
              <Image
                src="/studio/covers/p01-cover.webp"
                alt="Le Portal, salle d'entrée du KOV Virtual Studio"
                fill
                sizes="(min-width: 1024px) 700px, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, transparent 60%, rgba(5,5,5,0.7))" }}
              />
            </div>

            <div
              className="absolute top-5 left-5 flex items-center gap-2 px-3 py-1.5"
              style={{
                borderRadius: "var(--radius-pill)",
                background: "var(--glass-bg)",
                backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
              <span className="text-kov-bone text-[10px] uppercase tracking-widest">Visite 360°</span>
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
              <p className="text-kov-bone text-xs uppercase tracking-widest">Le Portal — Entrée du studio</p>
              <span
                aria-hidden="true"
                className="text-kov-bone text-xs uppercase tracking-widest inline-flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1"
              >
                Visiter →
              </span>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
