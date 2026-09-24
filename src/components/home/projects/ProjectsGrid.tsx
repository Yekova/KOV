"use client";

import type { Project } from "@/data/projects";
import { ProjectCard } from "@/components/home/projects/ProjectCard";

// Six cards, aligned. Three columns by two rows on desktop, two on a
// tablet, one on a phone — equal gaps, equal heights, nothing offset.
//
// The central hub and the curves that ran to it are gone with the
// asymmetry: a rectangle leaves no corridor between the rows to route
// anything through, and a diagram with nowhere to sit is just an overlap.
// Git holds them if the idea comes back.
const CARD_HEIGHT = 286;

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {projects.map((project) => (
        <div
          key={project.slug}
          // An animation hook, not a style: ScrollScene staggers these on
          // desktop. A data attribute rather than a class, so restyling the
          // card can never silently detach the motion from it.
          data-scroll-item
          className="h-[264px] lg:h-[var(--card-h)]"
          style={{ ["--card-h" as string]: `${CARD_HEIGHT}px` }}
        >
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
}
