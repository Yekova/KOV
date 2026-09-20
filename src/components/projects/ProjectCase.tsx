"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { Project } from "@/data/projects";
import { ProjectModal } from "./ProjectModal";

// One delivered project, as a card: the naming on the left, the work on the
// right, bleeding off the card's own edge.
//
// The reasoning — problem, system, result — is not on the card. It is in the
// modal, which is what the modal is for: a card that carried three labelled
// rows as well would be a page pretending to be a card. What stays visible is
// the part you scan: the number, the name, what field it is in, one line, and
// a way in.
//
// The whole card is the control. A single overlay button rather than one on
// the image and another in the text: the same action twice is two tab stops
// for one thing, and the visible pill is then free to be exactly as large as
// the design wants without being a hit target of its own.
export function ProjectCase({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);

  // Offered where there is something more to show — a film, a longer
  // description, or the reasoning itself. Both delivered projects qualify
  // today; a project with none of the three would simply get no control.
  const hasModal = Boolean(project.video || project.detail || project.narrative);

  return (
    <>
      <div className="kov-pcard__text">
        <span aria-hidden="true" className="kov-pcard__num">
          {project.id}
        </span>

        <h2 className="kov-pcard__name">{project.name}</h2>

        <p className="kov-pcard__cat">{project.category}</p>

        {project.tagline && <p className="kov-pcard__tagline">{project.tagline}</p>}

        {/* Decoration: the control is the overlay below, so this must not be
            a second focusable element announcing the same action. */}
        {hasModal && (
          <span aria-hidden="true" className="kov-pcard__pill">
            Voir le projet
            <span className="kov-pcard__pill-arrow">↗</span>
          </span>
        )}
      </div>

      <div className="kov-pcard__media">
        {project.image ? (
          <Image
            src={project.image}
            alt={`${project.name} — ${project.category}`}
            fill
            sizes="(max-width: 1023px) 92vw, 44vw"
            className="kov-pcard__img"
          />
        ) : (
          // A delivered project with no photograph yet gets a reserved
          // panel, never a stand-in image. Same rule as the homepage cards.
          <span className="kov-pcard__reserved">Visuel à venir</span>
        )}

        {/* Dissolves the picture's left edge into the card instead of
            butting it against the text with a hard seam. */}
        <span aria-hidden="true" className="kov-pcard__fade" />

        {/* Only where a film exists — a play badge over a still image is a
            promise the card cannot keep. */}
        {project.video && (
          <span aria-hidden="true" className="kov-pcard__play">
            <Play size={16} strokeWidth={2} fill="currentColor" />
          </span>
        )}

        <ul className="kov-pcard__tags">
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>

      {hasModal && (
        <>
          <button
            type="button"
            className="kov-pcard__hit"
            onClick={() => setOpen(true)}
            aria-label={`${project.name} — ${project.category}`}
          />
          <ProjectModal project={project} open={open} onClose={() => setOpen(false)} />
        </>
      )}
    </>
  );
}
