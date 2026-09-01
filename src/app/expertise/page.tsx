import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TagPill } from "@/components/ui/Chip";
import { ParticleImage } from "@/components/home/ParticleImageLazy";
import { PILLARS } from "@/data/expertisePillars";
import { PROCESS } from "@/data/processSteps";
import { SERVICES } from "@/data/services";

const SITE_URL = "https://kov-agency.site";

export const metadata: Metadata = {
  title: "Expertise — KOV",
  description: "Stratégie, design, développement, motion, systèmes et intégration, construits comme un seul système.",
  alternates: { canonical: `${SITE_URL}/expertise` },
};

export default function ExpertisePage() {
  return (
    <main className="min-h-screen pb-32">
      <section className="relative overflow-hidden px-6 pt-40 pb-24 md:pb-32">
        <ParticleImage src="/kov/menu/bureau-moderne.jpg" />
        <div
          className="absolute inset-0"
          style={{
            zIndex: "var(--z-atmosphere)",
            background: "linear-gradient(180deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.6) 55%, rgba(10,10,10,0.9) 100%)",
          }}
        />

        <div className="relative max-w-[1600px] mx-auto" style={{ zIndex: "var(--z-content)" }}>
          <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Expertise</p>

          <h1
            className="font-display text-kov-bone uppercase max-w-4xl"
            style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
          >
            On ne décore pas<span className="text-kov-red">.</span>
            <br />
            On construit des systèmes qui tiennent<span className="text-kov-red">.</span>
          </h1>
        </div>
      </section>

      <div className="px-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t" style={{ borderColor: "var(--kov-border)" }}>
          {PILLARS.map((pillar) => (
            <div key={pillar.number} id={pillar.slug} className="pt-10 scroll-mt-32">
              <p className="text-kov-red font-mono text-xs mb-4">{pillar.number}</p>
              <h2 className="font-display text-kov-bone uppercase text-2xl mb-4">{pillar.title}</h2>
              <p className="text-kov-concrete text-sm leading-relaxed">{pillar.body}</p>
            </div>
          ))}
        </div>

        <section className="mt-40">
          <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Processus</p>
          <h2
            className="font-display text-kov-bone uppercase mb-16"
            style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
          >
            Sept étapes<span className="text-kov-red">.</span> Pas de boîte noire.
          </h2>

          <ol className="border-t" style={{ borderColor: "var(--kov-border)" }}>
            {PROCESS.map((step) => (
              <li
                key={step.number}
                className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8 py-6 border-b"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <span className="text-kov-red font-mono text-xs w-10 shrink-0">{step.number}</span>
                <span className="font-display text-kov-bone uppercase text-xl w-full md:w-48 shrink-0">
                  {step.title}
                </span>
                <span className="text-kov-concrete text-sm leading-relaxed">{step.body}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-40">
          <p className="text-xs uppercase tracking-widest text-kov-steel mb-6">Ce qu&apos;on construit</p>
          <div className="flex flex-wrap gap-3 max-w-3xl">
            {SERVICES.map((service) => (
              <Link key={service.slug} href={`/expertise/${service.slug}`} className="hover:opacity-70 transition-opacity">
                <TagPill>{service.title}</TagPill>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-32">
          <Button href="/contact" variant="primary">
            Démarrer un projet →
          </Button>
        </div>
      </div>
    </main>
  );
}
