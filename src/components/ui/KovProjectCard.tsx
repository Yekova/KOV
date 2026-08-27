import { KovCard } from "@/components/ui/KovCard";
import { TagPill } from "@/components/ui/Chip";
import { PROJECTS } from "@/data/projects";

interface KovProjectCardProps {
  project: (typeof PROJECTS)[number];
  index: number;
  total: number;
}

// Large, object-like project cards for KovCarousel — 70-85% of the
// viewport width per the brief, not a portfolio-grid tile. No project
// visuals exist yet for any of the four (see src/data/projects.ts), so
// this renders the same honest "en préparation" state WorkGallery/
// WorkSpotlight already established rather than a placeholder image that
// could read as a real screenshot.
export function KovProjectCard({ project, index, total }: KovProjectCardProps) {
  return (
    <KovCard
      variant="project"
      interactive
      className="relative w-full flex flex-col justify-end"
      style={{ aspectRatio: "16 / 10", minHeight: "420px" }}
    >
      <span className="absolute top-6 right-6 md:top-8 md:right-8 font-mono text-xs text-kov-steel">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>

      <p className="font-mono text-xs text-kov-steel mb-4">
        {project.id} — {project.status === "live" ? "visuel à venir" : "en préparation"}
      </p>

      <p
        className="font-display text-kov-bone uppercase"
        style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
      >
        {project.name}
      </p>

      <p className="mt-3 text-kov-steel text-sm uppercase tracking-widest">{project.category}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <TagPill key={tag}>{tag}</TagPill>
        ))}
      </div>
    </KovCard>
  );
}
