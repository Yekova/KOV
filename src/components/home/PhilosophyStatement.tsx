import { Reveal } from "@/components/ui/Reveal";

const WORDS = ["Clarté", "Intention", "Impact"];

export function PhilosophyStatement() {
  return (
    <section className="px-6 py-32 max-w-[1600px] mx-auto">
      <Reveal>
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Philosophie</p>
        <h2
          className="font-display text-kov-bone uppercase max-w-3xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Le bon design n&apos;a pas besoin de crier<span className="text-kov-red">.</span>
        </h2>
      </Reveal>
      <Reveal delay={0.15}>
        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-2">
          {WORDS.map((word) => (
            <span key={word} className="text-kov-concrete text-sm uppercase tracking-widest">
              {word}.
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
