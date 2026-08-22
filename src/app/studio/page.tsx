import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PRINCIPLES } from "@/data/studioPrinciples";

export const metadata: Metadata = {
  title: "Studio — KOV",
  description: "KOV est un studio construit autour d'une idée : transformer des idées en expériences numériques dont on se souvient.",
};

const PHILOSOPHY_WORDS = ["Clarté", "Intention", "Impact"];

export default function StudioPage() {
  return (
    <main className="min-h-screen px-6 pt-40 pb-32 max-w-[1600px] mx-auto">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Studio</p>

      <h1
        className="font-display text-kov-bone uppercase max-w-4xl"
        style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
      >
        KOV transforme les idées
        <br />
        en expériences numériques<span className="text-kov-red">.</span>
      </h1>

      <p className="mt-6 text-xs uppercase tracking-widest text-kov-steel">Design / Développement / Motion — Bordeaux, France</p>

      <p className="mt-10 max-w-xl text-kov-concrete text-sm leading-relaxed">
        On est un studio qui construit des sites et des plateformes pour ceux qui ne veulent pas
        ressembler à tout le monde. Pas de templates, pas de banques d&apos;images, pas de discours d&apos;agence générique.
        Chaque projet part de ce qui le rend différent — pas de ce qui est facile à livrer.
      </p>

      <section className="mt-32">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Philosophie</p>
        <h2
          className="font-display text-kov-bone uppercase max-w-3xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Le bon design n&apos;a pas besoin de crier<span className="text-kov-red">.</span>
        </h2>
        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-2">
          {PHILOSOPHY_WORDS.map((word) => (
            <span key={word} className="text-kov-concrete text-sm uppercase tracking-widest">
              {word}.
            </span>
          ))}
        </div>
      </section>

      <div
        className="mt-32 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 border-t pt-12"
        style={{ borderColor: "var(--kov-border)" }}
      >
        {PRINCIPLES.map((principle) => (
          <div key={principle.word} id={principle.slug} className="scroll-mt-32">
            <h2 className="font-display text-kov-bone uppercase text-2xl mb-3">{principle.word}</h2>
            <p className="text-kov-concrete text-sm leading-relaxed">{principle.body}</p>
          </div>
        ))}
      </div>

      <section className="mt-32 border-t pt-16" style={{ borderColor: "var(--kov-border)" }}>
        <h2
          className="font-display text-kov-bone uppercase max-w-2xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Petit par choix<span className="text-kov-red">.</span>
        </h2>
        <p className="mt-6 max-w-md text-kov-concrete text-sm leading-relaxed">
          Moins de niveaux hiérarchiques.
          <br />
          Plus d&apos;implication.
          <br />
          Un meilleur travail.
        </p>
      </section>

      <div className="mt-32">
        <Button href="/contact" variant="primary">
          Démarrer un projet →
        </Button>
      </div>
    </main>
  );
}
