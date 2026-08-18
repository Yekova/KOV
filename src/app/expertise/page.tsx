import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { TagPill } from "@/components/ui/Chip";

export const metadata: Metadata = {
  title: "Expertise — KOV",
  description: "Stratégie, design, développement, motion, systèmes et intégration, construits comme un seul système.",
};

const PILLARS = [
  {
    number: "01",
    title: "Stratégie",
    body: "Positionnement, structure et parcours utilisateurs — décidés avant même de commencer à designer quoi que ce soit.",
  },
  {
    number: "02",
    title: "Design",
    body: "Des interfaces pensées comme de l'architecture. La structure d'abord, le style ensuite — jamais l'inverse pour masquer une mauvaise structure.",
  },
  {
    number: "03",
    title: "Développement",
    body: "Du code de production dès le premier jour. Rapide, précis, conçu pour tenir face aux vrais utilisateurs et au vrai trafic.",
  },
  {
    number: "04",
    title: "Motion",
    body: "Un mouvement qui explique, jamais qui joue un rôle. Chaque transition existe pour communiquer quelque chose — ou n'existe pas.",
  },
  {
    number: "05",
    title: "Systèmes",
    body: "Une architecture numérique conçue pour évoluer — pas un site figé qui casse dès que l'activité grandit.",
  },
  {
    number: "06",
    title: "Intégration",
    body: "Outils, données et automatisations, connectés — pour que le site soit la façade de quelque chose qui tourne vraiment.",
  },
];

const PROCESS = [
  { number: "01", title: "Découvrir", body: "Ce qui compte vraiment ici, pas un brief générique." },
  { number: "02", title: "Structurer", body: "Architecture de l'information et priorités, verrouillées." },
  { number: "03", title: "Design", body: "La direction décidée avant qu'un seul pixel ne soit livré." },
  { number: "04", title: "Développer", body: "Construit en transparence, itéré en code réel." },
  { number: "05", title: "Motion", body: "L'interaction intégrée dès le départ — jamais ajoutée après coup." },
  { number: "06", title: "Lancer", body: "Livré, mesuré, laissé dans un état que n'importe qui peut maintenir." },
  { number: "07", title: "Évoluer", body: "Un site n'est jamais terminé — il est maintenu intentionnellement." },
];

const WHAT_WE_BUILD = [
  "Sites corporate",
  "Sites immersifs",
  "Applications web",
  "Dashboards",
  "Espaces clients",
  "Systèmes numériques",
];

export default function ExpertisePage() {
  return (
    <main className="min-h-screen px-6 pt-40 pb-32 max-w-[1600px] mx-auto">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Expertise</p>

      <h1
        className="font-display text-kov-bone uppercase max-w-4xl"
        style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
      >
        On ne décore pas<span className="text-kov-red">.</span>
        <br />
        On construit des systèmes qui tiennent<span className="text-kov-red">.</span>
      </h1>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t" style={{ borderColor: "var(--kov-border)" }}>
        {PILLARS.map((pillar) => (
          <div key={pillar.number} className="pt-10">
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
          {WHAT_WE_BUILD.map((item) => (
            <TagPill key={item}>{item}</TagPill>
          ))}
        </div>
      </section>

      <div className="mt-32">
        <Button href="/contact" variant="primary">
          Démarrer un projet →
        </Button>
      </div>
    </main>
  );
}
