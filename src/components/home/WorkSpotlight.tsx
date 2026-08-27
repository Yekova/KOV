import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { TagPill } from "@/components/ui/Chip";
import { Reveal } from "@/components/ui/Reveal";
import { PROJECTS } from "@/data/projects";

// The transition out of Processus, into a single featured project — pulls
// from the same PROJECTS array WorkGallery uses (previously this spotlight
// hardcoded its own separate copy of Kanti, which could silently drift from
// the grid version). Renders nothing if no project has shipped yet, rather
// than showing a placeholder spotlight for a placeholder project.
export function WorkSpotlight() {
  const featured = PROJECTS.find((project) => project.status === "live");
  if (!featured) return null;

  return (
    <section className="px-6 py-32 max-w-[1600px] mx-auto">
      <Reveal>
        <h2
          className="font-display text-kov-bone uppercase max-w-2xl mb-16"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Chaque projet laisse une trace<span className="text-kov-red">.</span>
        </h2>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <Reveal variant="zoom" className="md:col-span-2">
          <GlassCard interactive className="min-h-[360px] flex items-end p-8">
            <p className="text-kov-steel font-mono text-xs uppercase tracking-widest">
              Visuel à venir — étude de cas en préparation
            </p>
          </GlassCard>
        </Reveal>

        <Reveal variant="zoom" delay={0.15} className="flex flex-col justify-center">
          <p className="text-kov-red font-mono text-xs mb-2">Projet / {featured.id}</p>
          <h3 className="font-display text-kov-bone uppercase text-3xl mb-3">{featured.name}</h3>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-6">{featured.category}</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {featured.tags.map((tag) => (
              <TagPill key={tag}>{tag}</TagPill>
            ))}
          </div>
          {featured.caseStudyHref ? (
            <Link
              href={featured.caseStudyHref}
              className="text-kov-red text-xs uppercase tracking-widest hover:text-kov-red-signal transition-colors"
            >
              Voir l&apos;étude de cas →
            </Link>
          ) : (
            <span className="text-kov-steel text-xs uppercase tracking-widest">Étude de cas en préparation</span>
          )}
        </Reveal>
      </div>
    </section>
  );
}
