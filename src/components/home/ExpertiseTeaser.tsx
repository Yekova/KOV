import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PILLARS } from "@/data/expertisePillars";

export function ExpertiseTeaser() {
  return (
    <section className="px-6 py-32 max-w-[1600px] mx-auto">
      <Reveal>
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Expertise</p>
        <h2
          className="font-display text-kov-bone uppercase max-w-3xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Six disciplines<span className="text-kov-red">.</span> Un seul système<span className="text-kov-red">.</span>
        </h2>
        <p className="mt-6 max-w-xl text-kov-concrete text-sm leading-relaxed">
          Pas six prestataires empilés qui se renvoient la responsabilité —
          une seule équipe qui pense stratégie, design, développement, motion,
          systèmes et intégration comme un seul système, du premier brief à la
          maintenance.
        </p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 border-t pt-10" style={{ borderColor: "var(--kov-border)" }}>
        {PILLARS.map((pillar, index) => (
          <Reveal key={pillar.slug} delay={0.1 + index * 0.06}>
            <p className="text-kov-red font-mono text-xs mb-3">{pillar.number}</p>
            <h3 className="font-display text-kov-bone uppercase text-xl mb-2">{pillar.title}</h3>
            <p className="text-kov-concrete text-sm leading-relaxed">{pillar.body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.3}>
        <Button href="/expertise" variant="secondary" className="mt-16">
          Voir l&apos;expertise →
        </Button>
      </Reveal>
    </section>
  );
}
