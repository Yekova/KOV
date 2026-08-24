import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { FAQ } from "@/data/faq";

const SITE_URL = "https://kov-agency.site";

export const metadata: Metadata = {
  title: "FAQ — KOV",
  description: "Délais, processus, budget, maintenance — les réponses aux questions les plus fréquentes avant de démarrer un projet avec KOV.",
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

      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">FAQ</p>

      <h1
        className="font-display text-kov-bone uppercase max-w-3xl"
        style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
      >
        Les questions qu&apos;on nous pose<span className="text-kov-red">.</span>
      </h1>

      <div className="mt-20 max-w-3xl border-t" style={{ borderColor: "var(--kov-border)" }}>
        {FAQ.map((item) => (
          <details
            key={item.question}
            className="group border-b py-6 [&::-webkit-details-marker]:hidden"
            style={{ borderColor: "var(--kov-border)" }}
          >
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
              <span className="font-display text-kov-bone uppercase text-lg md:text-xl">{item.question}</span>
              <span className="relative w-4 h-4 shrink-0 text-kov-red text-xl leading-none group-open:rotate-45 transition-transform duration-300">
                +
              </span>
            </summary>
            <p className="mt-4 max-w-2xl text-kov-concrete text-sm leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>

      <div className="mt-20">
        <Button href="/contact" variant="primary">
          Poser une autre question →
        </Button>
      </div>
    </main>
  );
}
