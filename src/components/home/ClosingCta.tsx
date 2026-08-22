import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function ClosingCta() {
  return (
    <section className="px-6 pt-32 max-w-[1600px] mx-auto">
      <Reveal className="border-t pt-20 flex flex-col items-start" style={{ borderColor: "var(--kov-border)" }}>
        <h2
          className="font-display text-kov-bone uppercase max-w-2xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Un projet en tête ?
          <br />
          <span className="text-kov-red">On le construit.</span>
        </h2>

        <Button href="/contact" variant="primary" className="mt-10">
          Démarrer un projet →
        </Button>
      </Reveal>
    </section>
  );
}
