import Link from "next/link";
import { KovCTA } from "@/components/ui/KovCTA";
import { Reveal } from "@/components/ui/Reveal";
import { CursorRevealWordmark } from "@/components/home/CursorRevealWordmark";

const TICK_CLASS = "absolute w-4 h-4 md:w-5 md:h-5 pointer-events-none";

function CornerTicks() {
  return (
    <>
      <span aria-hidden="true" className={`${TICK_CLASS} -top-px -left-px border-t border-l`} style={{ borderColor: "var(--kov-border)" }} />
      <span aria-hidden="true" className={`${TICK_CLASS} -top-px -right-px border-t border-r`} style={{ borderColor: "var(--kov-border)" }} />
      <span aria-hidden="true" className={`${TICK_CLASS} -bottom-px -left-px border-b border-l`} style={{ borderColor: "var(--kov-border)" }} />
      <span aria-hidden="true" className={`${TICK_CLASS} -bottom-px -right-px border-b border-r`} style={{ borderColor: "var(--kov-border)" }} />
    </>
  );
}

// The homepage's closing statement — deliberately minimal now (CTA pill +
// giant cursor-reveal wordmark, corner tick marks framing the block) rather
// than the previous eyebrow/headline/body composition: the footer right
// below already repeats the location/contact details, so this section's
// only job is one last, unmissable nudge toward /contact.
export function ClosingCta() {
  return (
    <section id="contact" className="px-6 pt-32 pb-8 max-w-[1600px] mx-auto scroll-mt-24">
      <Reveal variant="fade">
        <div
          className="relative border-t pt-20 pb-16 flex flex-col items-center text-center"
          style={{ borderColor: "var(--kov-border)" }}
        >
          <CornerTicks />

          <KovCTA href="/contact">Démarrer un projet</KovCTA>

          <Link href="/studio" className="mt-8 block" aria-label="Découvrir le studio KOV">
            <CursorRevealWordmark text="Studio" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
