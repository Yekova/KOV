import { GlassCard } from "@/components/ui/GlassCard";
import { TagPill } from "@/components/ui/Chip";
import { Reveal } from "@/components/ui/Reveal";

// Placeholder gallery — real project imagery pending. Sizes are intentionally
// varied — a project is meant to feel like a distinct piece of work, not a
// row in a uniform 3x2 card grid.
const PROJECTS = [
  { id: "01", name: "Kanti", tag: "Gestion de patrimoine", span: "md:col-span-2 md:row-span-2" },
  { id: "02", name: "Projet 02", tag: "Placeholder", span: "md:col-span-2" },
  { id: "03", name: "Projet 03", tag: "Placeholder", span: "md:row-span-2" },
  { id: "04", name: "Projet 04", tag: "Placeholder", span: "" },
];

export function WorkGallery() {
  return (
    <section id="work-gallery" className="px-6 py-32 max-w-[1600px] mx-auto scroll-mt-24">
      <Reveal>
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Projets sélectionnés</p>
        <h2
          className="font-display text-kov-bone uppercase max-w-3xl mb-4"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Projets<span className="text-kov-red">.</span>
        </h2>
        <p className="max-w-xl text-kov-concrete text-sm leading-relaxed mb-16">
          Un projet n&apos;est jamais une carte dans une grille interchangeable
          — c&apos;est une identité, une architecture d&apos;information et un
          système qui doit tenir bien après la livraison.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6">
        {PROJECTS.map((project, index) => (
          <Reveal key={project.id} variant="zoom" delay={0.1 + index * 0.06} className={project.span}>
            <GlassCard
              interactive
              className="flex flex-col justify-end p-6 min-h-[240px] h-full transition-transform duration-500 hover:-translate-y-1"
            >
              <p className="text-kov-steel font-mono text-xs mb-3">{project.id} — visuel à venir</p>
              <p className="font-display text-kov-bone uppercase text-lg mb-2">{project.name}</p>
              <TagPill>{project.tag}</TagPill>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
