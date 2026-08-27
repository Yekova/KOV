import { Reveal } from "@/components/ui/Reveal";
import { PROCESS } from "@/data/processSteps";

export function ProcessTimeline() {
  return (
    <section className="px-6 py-32 max-w-[1600px] mx-auto">
      <Reveal>
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Processus</p>
        <h2
          className="font-display text-kov-bone uppercase max-w-3xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Sept étapes<span className="text-kov-red">.</span> Pas de boîte noire<span className="text-kov-red">.</span>
        </h2>
        <p className="mt-6 mb-20 max-w-xl text-kov-concrete text-sm leading-relaxed">
          Un projet ne doit jamais disparaître derrière un écran jusqu&apos;à
          sa livraison. Chaque étape est visible, discutée et construite avec
          vous.
        </p>
      </Reveal>

      <ol className="relative flex flex-col md:flex-row md:items-start justify-between gap-10 md:gap-6">
        <div
          className="hidden md:block absolute top-1.5 left-0 right-0 h-px"
          style={{ background: "var(--kov-border)" }}
        />
        {PROCESS.map((step, index) => (
          <Reveal
            key={step.number}
            as="li"
            delay={index * 0.06}
            className="relative flex md:flex-col items-start gap-3 md:gap-4 md:flex-1"
          >
            <span className="w-3 h-3 rounded-full bg-kov-red shrink-0 mt-1 md:mt-0" />
            <div>
              <p className="text-kov-red font-mono text-xs mb-1">{step.number}</p>
              <p className="font-display text-kov-bone uppercase text-sm mb-2">{step.title}</p>
              <p className="text-kov-steel text-xs leading-relaxed max-w-[16rem]">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
