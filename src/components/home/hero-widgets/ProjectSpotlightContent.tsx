import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Project } from "@/data/projects";

// The featured project, given rather than found.
//
// It used to be `PROJECTS[0]`, read at module load, with the picture written
// in by hand underneath — so reordering the list changed the name and the
// category while leaving someone else's screenshot above them. Both now come
// from the same object, and which object it is, is the caller's business.
export function ProjectSpotlightContent({ project, total }: { project: Project; total: number }) {
  if (!project.image) return null;

  return (
    <Link href="/#work-gallery" className="group relative block h-full w-full overflow-hidden" style={{ borderRadius: 20 }}>
      {/* No text over the mockup at rest — it stays fully visible so the
          real screenshot reads clearly. Everything (labels, title, CTA)
          only appears on hover, over a graying overlay so it's legible
          against whatever's underneath it. */}
      <Image
        src={project.image}
        alt={`Aperçu du site ${project.name}`}
        fill
        sizes="(min-width: 1024px) 30vw, 60vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "rgba(6,6,6,0.9)" }}
      />
      {/* Thin red line, invisible at rest — a targeted accent rather than a
          permanent red border (spec §06/§11). */}
      <div
        aria-hidden="true"
        className="absolute left-5 top-5 bottom-5 w-px opacity-0 group-hover:opacity-60 transition-opacity duration-300"
        style={{ background: "linear-gradient(to bottom, transparent, var(--kov-red), transparent)" }}
      />

      <div className="relative h-full w-full flex flex-col justify-between p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-kov-steel text-[10px] uppercase tracking-widest">
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
            Projet featured
          </p>
          {/* Both halves of the counter are real now. The left one was the
              literal string "01" even after the list was reordered. */}
          <span className="text-kov-steel text-[10px] tabular-nums">
            {project.id} / {String(total).padStart(2, "0")}
          </span>
        </div>

        <div>
          <p className="text-kov-steel text-[10px] uppercase tracking-widest">{project.category}</p>
          <h3 className="font-display text-kov-bone uppercase mt-1" style={{ fontSize: "clamp(22px, 2.4vw, 32px)" }}>
            {project.name}
          </h3>
          <p className="text-kov-steel text-[11px] uppercase tracking-widest mt-1">{project.tags.join(" / ")}</p>

          <span className="mt-4 inline-flex items-center gap-2 text-kov-bone text-[11px] uppercase tracking-widest">
            <span
              aria-hidden="true"
              className="inline-flex w-7 h-7 items-center justify-center rounded-full transition-transform group-hover:translate-x-1"
              style={{ border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <ArrowRight size={13} className="group-hover:text-kov-red transition-colors" />
            </span>
            Voir le projet
          </span>
        </div>
      </div>
    </Link>
  );
}
