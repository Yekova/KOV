import { Reveal } from "@/components/ui/Reveal";
import { PRINCIPLES } from "@/data/studioPrinciples";

export function PhilosophyStatement() {
  return (
    <section className="px-6 py-32 max-w-[1600px] mx-auto">
      <Reveal variant="blur">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Philosophie</p>
        <h2
          className="font-display text-kov-bone uppercase max-w-3xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Le bon design n&apos;a pas besoin de crier<span className="text-kov-red">.</span>
        </h2>
        <p className="mt-6 max-w-xl text-kov-concrete text-sm leading-relaxed">
          On construit des expériences numériques pour ceux qui ne veulent pas
          ressembler à tout le monde. Pas de template choisi avant la
          réflexion. Pas de banque d&apos;images pour remplir un espace. Pas
          de discours d&apos;agence interchangeable. Chaque projet commence
          par ce qui le rend différent — puis on construit autour de cette
          différence.
        </p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 border-t pt-10" style={{ borderColor: "var(--kov-border)" }}>
        {PRINCIPLES.map((principle, index) => (
          <Reveal key={principle.slug} variant="blur" delay={0.15 + index * 0.08}>
            <h3 className="font-display text-kov-bone uppercase text-xl mb-2">{principle.word}</h3>
            <p className="text-kov-concrete text-sm leading-relaxed">{principle.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
