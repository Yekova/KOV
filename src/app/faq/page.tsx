import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
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

      <Reveal>
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">FAQ</p>
        <h1
          className="font-display text-kov-bone uppercase max-w-3xl"
          style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Les questions qu&apos;on nous pose<span className="text-kov-red">.</span>
        </h1>
        <p className="mt-6 max-w-xl text-kov-concrete text-sm leading-relaxed">
          Le projet, le budget, la technique, le suivi après la mise en ligne — ce qu&apos;on répond le plus souvent
          avant qu&apos;un projet démarre. Cherchez un mot, ou parcourez par sujet.
        </p>
      </Reveal>

      <div className="mt-16">
        <FaqEngine />
      </div>

      <div className="mt-20">
        <Button href="/contact" variant="primary">
          Poser une autre question →
        </Button>
      </div>
    </main>
  );
}
