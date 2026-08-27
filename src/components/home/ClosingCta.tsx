import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function ClosingCta() {
  return (
    <section className="px-6 pt-32 max-w-[1600px] mx-auto">
      <Reveal variant="blur" className="border-t pt-20 flex flex-col items-start" style={{ borderColor: "var(--kov-border)" }}>
        <h2
          className="font-display text-kov-bone uppercase max-w-2xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Un projet en tête<span className="text-kov-red">?</span>
        </h2>

        <p className="mt-6 max-w-md text-kov-concrete text-sm leading-relaxed">
          On commence par une conversation. Pas de brief interminable, pas de
          jargon, pas de promesse inutile — un premier échange pour
          comprendre le problème, définir une direction et savoir ce
          qu&apos;il faut construire.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Button href="/contact" variant="primary">
            Parler de mon projet →
          </Button>
          <Button href="/studio" variant="ghost">
            Explorer KOV →
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
