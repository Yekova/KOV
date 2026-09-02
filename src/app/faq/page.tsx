import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { GlassCard } from "@/components/ui/GlassCard";
import { KovCTA } from "@/components/ui/KovCTA";
import { FAQ } from "@/data/faq";
import { FaqEngine } from "@/components/faq/FaqEngine";

const SITE_URL = "https://kov-agency.site";

export const metadata: Metadata = {
  title: "FAQ — KOV",
  description: "Délais, processus, budget, technique — les réponses aux questions les plus fréquentes avant de démarrer un projet avec KOV.",
  alternates: { canonical: `${SITE_URL}/faq` },
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main className="min-h-screen px-6 pt-40 pb-32 max-w-[1600px] mx-auto">
      {/* Static, hardcoded JSON, no user input — dangerouslySetInnerHTML is the only way to emit raw JSON-LD. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-12 md:gap-16 items-stretch">
        <Reveal>
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-kov-steel mb-4">
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
            FAQ
          </p>
          <h1
            className="font-display text-kov-bone uppercase max-w-2xl"
            style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
          >
            Les questions qu&apos;on nous pose<span className="text-kov-red">.</span>
          </h1>
          <p className="mt-6 max-w-xl text-kov-concrete text-sm leading-relaxed">
            Le projet, le budget, la technique, le suivi après la mise en ligne — ce qu&apos;on répond le plus souvent
            avant qu&apos;un projet démarre. Cherchez un mot, ou parcourez par sujet.
          </p>
        </Reveal>

        <Reveal variant="zoom" delay={0.15} className="hidden md:block relative overflow-hidden min-h-[360px]">
          <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: "var(--radius-glass)" }}>
            <Image
              src="/kov/menu/atrium-brutaliste.jpg"
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>

      <div className="mt-16">
        <FaqEngine />
      </div>

      <div className="mt-24">
        <Reveal>
          <GlassCard interactive className="overflow-hidden">
            <div className="flex flex-col md:flex-row items-stretch">
              <div className="relative w-full md:w-64 h-40 md:h-auto shrink-0">
                <Image src="/kov/menu/couloir-brutaliste.jpg" alt="" aria-hidden="true" fill sizes="256px" className="object-cover" />
              </div>
              <div className="flex-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 md:p-10">
                <div>
                  <p className="text-xs uppercase tracking-widest text-kov-steel mb-3">Pas trouvé la réponse ?</p>
                  <h2 className="font-display text-kov-bone uppercase" style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}>
                    On est là pour ça<span className="text-kov-red">.</span>
                  </h2>
                  <p className="mt-4 max-w-md text-kov-concrete text-sm leading-relaxed">
                    Si votre question n&apos;est pas dans la liste, écrivez-nous. On vous répond rapidement.
                  </p>
                </div>
                <KovCTA href="/contact" className="shrink-0">
                  Nous contacter
                </KovCTA>
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </main>
  );
}
