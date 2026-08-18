import { GlassCard } from "@/components/ui/GlassCard";
import { TagPill } from "@/components/ui/Chip";

// Placeholder gallery — real project imagery pending. Sizes are intentionally
// varied per docs/KOV-IMMERSIVE-SCENES.md ("never a uniform 3x2 card grid").
const PROJECTS = [
  { id: "01", name: "Kanti", tag: "Gestion de patrimoine", span: "md:col-span-2 md:row-span-2" },
  { id: "02", name: "Projet 02", tag: "Placeholder", span: "md:col-span-2" },
  { id: "03", name: "Projet 03", tag: "Placeholder", span: "md:row-span-2" },
  { id: "04", name: "Projet 04", tag: "Placeholder", span: "" },
];

export function WorkGallery() {
  return (
    <section id="work-gallery" className="px-6 py-32 max-w-[1600px] mx-auto">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Projets sélectionnés</p>
      <h2
        className="font-display text-kov-bone uppercase max-w-3xl mb-16"
        style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
      >
        Projets<span className="text-kov-red">.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6">
        {PROJECTS.map((project) => (
          <GlassCard key={project.id} className={`flex flex-col justify-end p-6 min-h-[240px] ${project.span}`}>
            <p className="text-kov-steel font-mono text-xs mb-3">{project.id} — visuel à venir</p>
            <p className="font-display text-kov-bone uppercase text-lg mb-2">{project.name}</p>
            <TagPill>{project.tag}</TagPill>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
