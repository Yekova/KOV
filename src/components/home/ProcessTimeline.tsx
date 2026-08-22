import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  { number: "01", title: "Découvrir" },
  { number: "02", title: "Structurer" },
  { number: "03", title: "Design" },
  { number: "04", title: "Développer" },
  { number: "05", title: "Motion" },
  { number: "06", title: "Lancer" },
  { number: "07", title: "Évoluer" },
];

export function ProcessTimeline() {
  return (
    <section className="px-6 py-32 max-w-[1600px] mx-auto">
      <Reveal>
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Processus</p>
        <h2
          className="font-display text-kov-bone uppercase max-w-3xl mb-20"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Sept étapes<span className="text-kov-red">.</span> Pas de boîte noire<span className="text-kov-red">.</span>
        </h2>
      </Reveal>

      <ol className="relative flex flex-col md:flex-row md:items-start justify-between gap-10 md:gap-4">
        <div
          className="hidden md:block absolute top-1.5 left-0 right-0 h-px"
          style={{ background: "var(--kov-border)" }}
        />
        {STEPS.map((step, index) => (
          <Reveal
            key={step.number}
            as="li"
            delay={index * 0.06}
            className="relative flex md:flex-col items-center md:items-start gap-3 md:gap-4 md:flex-1"
          >
            <span className="w-3 h-3 rounded-full bg-kov-red shrink-0" />
            <div>
              <p className="text-kov-red font-mono text-xs">{step.number}</p>
              <p className="font-display text-kov-bone uppercase text-sm">{step.title}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
