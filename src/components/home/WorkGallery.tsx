import { GlassCard } from "@/components/ui/GlassCard";
import { TagPill } from "@/components/ui/Chip";
import { Reveal } from "@/components/ui/Reveal";
import { PROJECTS } from "@/data/projects";

// Layout only — kept separate from the shared PROJECTS data since span/size
// is a presentation concern, not project content. Sizes are intentionally
// varied so a project feels like a distinct piece of work, not a row in a
// uniform 3x2 card grid.
const SPAN_BY_ID: Record<string, string> = {
  "01": "md:col-span-2 md:row-span-2",
  "02": "md:col-span-2",
  "03": "md:row-span-2",
  "04": "",
};

export function WorkGallery() {
  return (
    <section id="work-gallery" className="px-6 py-32 max-w-[1600px] mx-auto scroll-mt-24">
      <Reveal>
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Projets sélectionnés</p>
        <h2
          className="font-display text-kov-bone uppercase max-w-3xl mb-4"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Des projets<span className="text-kov-red">.</span> Pas des cartes<span className="text-kov-red">.</span>
        </h2>
        <p className="max-w-xl text-kov-concrete text-sm leading-relaxed mb-16">
          Un projet KOV n&apos;est pas une miniature dans une grille — c&apos;est
          une identité, une architecture, une interface et un système conçus
          pour fonctionner ensemble, bien après la livraison.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6">
        {PROJECTS.map((project, index) => (
          <Reveal key={project.id} variant="zoom" delay={0.1 + index * 0.06} className={SPAN_BY_ID[project.id]}>
            <GlassCard
              interactive
              className="flex flex-col justify-end p-6 min-h-[240px] h-full transition-transform duration-500 hover:-translate-y-1"
            >
              <p className="text-kov-steel font-mono text-xs mb-3">
                {project.id} — {project.status === "live" ? "visuel à venir" : "en préparation"}
              </p>
              <p className="font-display text-kov-bone uppercase text-lg mb-3">{project.name}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <TagPill key={tag}>{tag}</TagPill>
                ))}
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
