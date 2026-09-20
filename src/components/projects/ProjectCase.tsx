"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { NARRATIVE_ROWS, type Project } from "@/data/projects";
import { ProjectModal } from "./ProjectModal";

// One delivered project, at full page width.
//
// Not a bigger card. The homepage already has the cards, and a page that
// repeated them larger would add size without adding anything to read. What
// this adds is the reasoning — the problem, the system built for it, and
// what changed — and, where one has been filmed, the thing itself moving.
//
// Everything is real HTML from the first byte. The modal's contents are the
// only exception, and they are additional rather than a place the page's own
// content went to hide.
export function ProjectCase({ project, index }: { project: Project; index: number }) {
  const [open, setOpen] = useState(false);

  // The name leads, then the plate — so the eye starts on the word and the
  // image confirms it, rather than meeting an unlabelled picture. Sides
  // alternate below, so two entries read as a rhythm and not as a table.
  const flipped = index % 2 === 1;

  // Offered only where there is something more to show. No empty player, no
  // modal that opens onto the same three lines already on the page.
  const hasModal = Boolean(project.video || project.detail);

  const frame = (
    <div className="kov-case__frame">
      {project.image ? (
        <Image
          src={project.image}
          alt={`${project.name} — ${project.category}`}
          fill
          sizes="(max-width: 1023px) 92vw, 48vw"
          className="kov-case__img"
        />
      ) : (
        // A delivered project with no photograph yet gets a reserved panel,
        // never a stand-in image. Same rule as the homepage cards.
        <div className="kov-case__reserved">
          <span>Visuel à venir</span>
        </div>
      )}

      {project.tagline && <span className="kov-case__tagline">{project.tagline}</span>}
    </div>
  );

  return (
    <>
      <header className="kov-case__head">
        <span aria-hidden="true" className="kov-case__index">
          {project.id}
        </span>
        <h2 className="kov-case__name">{project.name}</h2>
        <span className="kov-case__cat">{project.category}</span>
      </header>

      <div className={`kov-case__plate${flipped ? " kov-case__plate--flip" : ""}`}>
        {hasModal ? (
          // The image is the obvious thing to click, so it is the control.
          // The button in the text column is the same action stated in
          // words, for anyone who does not think to try the picture.
          <button
            type="button"
            className="kov-case__trigger"
            onClick={() => setOpen(true)}
            aria-label={`${project.video ? "Voir la vidéo" : "En savoir plus"} — ${project.name}`}
          >
            {frame}
            <span aria-hidden="true" className="kov-case__play">
              <Play size={17} strokeWidth={2} fill="currentColor" />
            </span>
          </button>
        ) : (
          frame
        )}
      </div>

      <div className={`kov-case__body${flipped ? " kov-case__body--flip" : ""}`}>
        <ul className="kov-case__tags">
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>

        {project.narrative && (
          // <dl> is the element for label→value pairs and assistive tech
          // handles it well. Always visible, always in the markup.
          <dl className="kov-case__story">
            {NARRATIVE_ROWS.map((row) => (
              <div key={row.key} className="kov-case__row">
                <dt>{row.label}</dt>
                <dd>{project.narrative?.[row.key]}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Every link here is conditional and points only at a route that
            exists. Kanti has neither an href nor a case study today, so it
            shows neither rather than a dead button. */}
        <div className="kov-case__links">
          {hasModal && (
            <button type="button" onClick={() => setOpen(true)} className="kov-case__link kov-case__link--primary">
              {project.video ? "Voir la vidéo" : "En savoir plus"}
              <Play size={12} strokeWidth={2} fill="currentColor" aria-hidden="true" />
            </button>
          )}
          {project.href && (
            <Link href={project.href} className="kov-case__link">
              Voir le projet
              <span aria-hidden="true">↗</span>
            </Link>
          )}
          {project.caseStudyHref && (
            <Link href={project.caseStudyHref} className="kov-case__link">
              Lire l&apos;étude de cas
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>

      {hasModal && <ProjectModal project={project} open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
