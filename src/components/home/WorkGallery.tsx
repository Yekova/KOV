import { Reveal } from "@/components/ui/Reveal";
import { KovCarousel } from "@/components/ui/KovCarousel";
import { KovProjectCard } from "@/components/ui/KovProjectCard";
import { PROJECTS } from "@/data/projects";

// Immersive carousel per the brief's §9-10 — large, object-like cards
// (roughly 80% of the container width, not a portfolio-grid tile), drag/
// swipe/arrow/indicator navigation via KovCarousel. Replaces the previous
// 4-card bento grid.
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

      <Reveal variant="zoom" delay={0.15} className="mx-auto md:w-[85%]">
        <KovCarousel
          labels={PROJECTS.map((p) => p.name)}
          items={PROJECTS.map((project, index) => (
            <KovProjectCard key={project.id} project={project} index={index} total={PROJECTS.length} />
          ))}
        />
      </Reveal>
    </section>
  );
}
