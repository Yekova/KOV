"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { NARRATIVE_ROWS, type Project } from "@/data/projects";
import { ProjectModal } from "./ProjectModal";

// One delivered project, as a magazine spread: the picture running off one
// edge of the page, and a panel of text laid over the edge of it.
//
// Overlapping is the whole device. Text beside a picture is a two-column
// layout; text on top of a picture is a spread, and the few pixels of
// overlap are what stop two projects from reading as two rows of a table.
//
// It also buys the room the card version did not have, which is why the
// reasoning is back on the page rather than only in the modal: problem,
// system, result, in real HTML, where a crawler and a reader both get them
// without opening anything.
export function ProjectCase({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);

  // Offered where there is something more to show — a film, or a longer
  // description. The three lines below are already on the page, so a modal
  // that only repeated them would be a door onto the same room.
  const hasModal = Boolean(project.video || project.detail);

  const openModal = () => setOpen(true);

  return (
    <>
      <div className="kov-dip__media">
        {project.image ? (
          <Image
            src={project.image}
            alt={`${project.name} — ${project.category}`}
            fill
            sizes="(max-width: 1023px) 100vw, 62vw"
            className="kov-dip__img"
          />
        ) : (
          // A delivered project with no photograph yet gets a reserved
          // panel, never a stand-in image. Same rule as the homepage cards.
          <span className="kov-dip__reserved">Visuel à venir</span>
        )}

        <span aria-hidden="true" className="kov-dip__grade" />

        {/* A redundant pointer affordance, deliberately hidden from the
            keyboard and from assistive tech: the same action already has a
            real, labelled button in the panel, and offering it twice would
            be two tab stops and two announcements for one thing. Clicking a
            large image that shows a play badge has to work, though. */}
        {hasModal && (
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="kov-dip__mediaHit"
            onClick={openModal}
          >
            {project.video && (
              <span className="kov-dip__play">
                <Play size={18} strokeWidth={2} fill="currentColor" />
              </span>
            )}
          </button>
        )}
      </div>

      <div className="kov-dip__inner">
        <div className="kov-dip__panel">
          <p className="kov-dip__meta">
            <span aria-hidden="true" className="kov-dip__num">
              {project.id}
            </span>
            <span aria-hidden="true" className="kov-dip__rule" />
            {project.category}
          </p>

          <h2 className="kov-dip__name">{project.name}</h2>

          {project.tagline && <p className="kov-dip__tagline">{project.tagline}</p>}

          {project.narrative && (
            // <dl> is the element for label→value pairs, and assistive tech
            // handles it well. Always visible, never behind a disclosure.
            <dl className="kov-dip__story">
              {NARRATIVE_ROWS.map((row) => (
                <div key={row.key}>
                  <dt>{row.label}</dt>
                  <dd>{project.narrative?.[row.key]}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="kov-dip__foot">
            <ul className="kov-dip__tags">
              {project.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>

            {hasModal && (
              <button type="button" onClick={openModal} className="kov-dip__cta">
                {project.video ? "Voir la vidéo" : "En savoir plus"}
                <span aria-hidden="true" className="kov-dip__cta-arrow">
                  ↗
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {hasModal && <ProjectModal project={project} open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
