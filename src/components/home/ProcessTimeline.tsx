import { ScrollScene } from "@/components/ui/ScrollScene";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionVeil } from "@/components/home/SectionVeil";
import { ProcessGallery } from "@/components/home/process/ProcessGallery";

// Reassurance, placed right after the visitor has recognised their own
// problem in #philosophy.
//
// The seven steps used to be a rail of labels with one line of text under it.
// They are now an accordion gallery: each step shows the artefact it actually
// produces — a marked-up brief, a sitemap, a type scale, an editor, an easing
// curve, a checklist, a version stack — because "sept étapes, pas de boîte
// noire" is a claim about visibility, and a row of labels was still a box.
//
// A Server Component. The heading and the veil have no state; only the
// gallery does, and it carries its own client boundary.
export function ProcessTimeline() {
  return (
    <section id="process" className="relative px-6 py-20 md:py-32 max-w-[1600px] mx-auto scroll-mt-40">
      {/* Black ground with a cursor-lit hole in it — see SectionVeil. The
          content below must stay inside its own `relative` wrapper, or the
          veil paints over it. */}
      <SectionVeil />
      {/* A gentle scrubbed drift on the whole block, desktop only. It reads
          as motion *while* scrolling rather than motion *on arrival*, which
          is what the section was missing: it had two threshold fades and
          nothing in between. ScrollScene renders its own element for the
          transform, so the Reveal inside keeps its own. */}
      <ScrollScene className="relative" parallax={24}>
        <Reveal variant="blur">
          <SectionHeading
            eyebrow="Processus"
            title={
              <>
                Sept étapes.
                <br />
                Pas de boîte noire<span className="text-kov-red">.</span>
              </>
            }
            lede="Vous savez à tout moment où en est le projet, ce qui vient d'être fait et ce qui suit."
          />
        </Reveal>

        <Reveal variant="fade" delay={0.08}>
          <ProcessGallery />
        </Reveal>
      </ScrollScene>
    </section>
  );
}
