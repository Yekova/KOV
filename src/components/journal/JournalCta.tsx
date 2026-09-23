import { Button } from "@/components/ui/Button";

export function JournalCta() {
  return (
    <section className="px-6 py-24" style={{ background: "var(--kov-black)", borderTop: "1px solid var(--kov-border)" }}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-kov-bone uppercase text-2xl md:text-3xl mb-8">
          Un projet en tête<span className="text-kov-red">.</span> On en discute&nbsp;?
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button href="/contact" variant="primary">
            Prendre rendez-vous
          </Button>
          <Button href="/expertise" variant="secondary">
            Voir nos expertises
          </Button>
        </div>
      </div>
    </section>
  );
}
