"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { NARRATIVE_ROWS, PROJECTS, type Project } from "@/data/projects";
import { ProjectModal } from "./ProjectModal";

type View = "detail" | "list";

// The work, in two readings.
//
// Detail is the page: one full-width row per delivered project, on hairlines,
// with the number set huge and ghosted at the left and a position rail at the
// right. List is the same work as an index — number, name, field,
// disciplines, state — including the ones that are not published, because an
// index is exactly where the incomplete belongs and a showcase is exactly
// where it does not.
//
// One modal for the whole page rather than one per project: two dialogs in
// the DOM to show one at a time is two of everything for no reason, and the
// open project is a single piece of state either way.
export function ProjectsView() {
  const [view, setView] = useState<View>("detail");
  const [openId, setOpenId] = useState<string | null>(null);

  const delivered = useMemo(() => PROJECTS.filter((p) => p.status === "live"), []);
  const upcoming = useMemo(() => PROJECTS.filter((p) => p.status === "upcoming"), []);
  const indexed = useMemo(() => [...delivered, ...upcoming], [delivered, upcoming]);

  const openProject = openId ? (PROJECTS.find((p) => p.id === openId) ?? null) : null;

  return (
    <>
      {/* The control bar: what there is, and how to read it. */}
      <div className="kov-pr__bar">
        <p className="kov-pr__count">
          <b>{String(delivered.length).padStart(2, "0")}</b> en ligne
          <span aria-hidden="true">/</span>
          <b>{String(upcoming.length).padStart(2, "0")}</b> à venir
        </p>

        {/* aria-pressed, not a pair of links: this changes how the same
            content is displayed, it does not navigate anywhere. */}
        <div className="kov-pr__views" role="group" aria-label="Affichage des projets">
          <button
            type="button"
            className={`kov-pr__view${view === "detail" ? " is-on" : ""}`}
            aria-pressed={view === "detail"}
            onClick={() => setView("detail")}
          >
            Détail
          </button>
          <button
            type="button"
            className={`kov-pr__view${view === "list" ? " is-on" : ""}`}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            Liste
          </button>
        </div>
      </div>

      {view === "detail" ? (
        <DetailView projects={delivered} upcoming={upcoming} onOpen={setOpenId} />
      ) : (
        <ListView projects={indexed} onOpen={setOpenId} />
      )}

      {openProject && <ProjectModal project={openProject} open onClose={() => setOpenId(null)} />}
    </>
  );
}

/** Whether a project has anything behind a click: a film, or a longer
 *  description. The three narrative lines are already in the row, so a modal
 *  that only repeated them would be a door onto the same room. */
const hasMore = (project: Project) => Boolean(project.video || project.detail);

// ── Detail ───────────────────────────────────────────────────────────────

function DetailView({
  projects,
  upcoming,
  onOpen,
}: {
  projects: Project[];
  upcoming: Project[];
  onOpen: (id: string) => void;
}) {
  const total = projects.length;

  return (
    <div className="kov-pr__rows">
      {projects.map((project, index) => (
        <article key={project.id} id={`projet-${project.id}`} className="kov-row">
          <div className="kov-row__id">
            <span aria-hidden="true" className="kov-row__num">
              {project.id}
            </span>

            <h2 className="kov-row__name">{project.name}</h2>
            <span aria-hidden="true" className="kov-row__rule" />

            {project.tagline && <p className="kov-row__tagline">{project.tagline}</p>}

            {hasMore(project) ? (
              <button type="button" className="kov-row__link" onClick={() => onOpen(project.id)}>
                {project.video ? "Voir la vidéo" : "En savoir plus"}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              // Nothing behind a click yet: no recording, no case study, no
              // public URL. A button here would open onto the same three
              // lines already printed below.
              <span aria-hidden="true" className="kov-row__link is-inert">
                Détail ci-dessous
              </span>
            )}
          </div>

          <div className="kov-row__visual">
            {project.image ? (
              <Image
                src={project.screen ?? project.image}
                alt={`${project.name} — ${project.category}`}
                fill
                sizes="(max-width: 1023px) 92vw, 52vw"
                className="kov-row__img"
              />
            ) : (
              <span className="kov-row__reserved">Visuel à venir</span>
            )}

            {hasMore(project) && (
              // A redundant pointer affordance, out of the tab order and
              // hidden from assistive tech: the same action already has a
              // labelled button in the column. Clicking a large picture
              // still has to work.
              <button
                type="button"
                aria-hidden="true"
                tabIndex={-1}
                className="kov-row__visualHit"
                onClick={() => onOpen(project.id)}
              >
                {project.video && <span className="kov-row__play">▶</span>}
              </button>
            )}
          </div>

          {/* Where this row sits in the set, and what field it is in. Static
              per row — no observer, nothing to keep in sync. */}
          <div aria-hidden="true" className="kov-row__rail">
            <span className="kov-row__track">
              {projects.map((dot, i) => (
                <span key={dot.id} className={`kov-row__dot${i === index ? " is-on" : ""}`} />
              ))}
            </span>
            <span className="kov-row__caption">{project.category}</span>
          </div>

          {/* The reasoning, full width under the row. Real HTML, always
              visible: this is the page someone sends to a colleague. */}
          {project.narrative && (
            <dl className="kov-row__story">
              {NARRATIVE_ROWS.map((row) => (
                <div key={row.key}>
                  <dt>{row.label}</dt>
                  <dd>{project.narrative?.[row.key]}</dd>
                </div>
              ))}
            </dl>
          )}
        </article>
      ))}

      {upcoming.length > 0 && (
        <article className="kov-row kov-row--soon">
          <div className="kov-row__id">
            <span aria-hidden="true" className="kov-row__num">
              {upcoming[0].id}
            </span>
            <h2 className="kov-row__name">À venir</h2>
            <span aria-hidden="true" className="kov-row__rule" />
            <p className="kov-row__tagline">
              {upcoming.length} projets qui ne sont pas encore en ligne. Ils rejoindront cette page quand ils le
              seront.
            </p>
          </div>

          {/* No reserved cards and no "Bientôt" plates: the worst tell of a
              thin portfolio is empty frames dressed up as work. Rows. */}
          <ol className="kov-row__soonList">
            {upcoming.map((project) => (
              <li key={project.id}>
                <span className="kov-row__soonNum">{project.id}</span>
                <span className="kov-row__soonTags">
                  {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </span>
                <span className="kov-row__soonState">Non publié</span>
              </li>
            ))}
          </ol>

          <div aria-hidden="true" className="kov-row__rail">
            <span className="kov-row__track">
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className="kov-row__dot" />
              ))}
            </span>
            <span className="kov-row__caption">La suite</span>
          </div>
        </article>
      )}
    </div>
  );
}

// ── List ─────────────────────────────────────────────────────────────────

function ListView({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  return (
    <div className="kov-list">
      <div aria-hidden="true" className="kov-list__head">
        <span>#</span>
        <span>Projet</span>
        <span>Domaine</span>
        <span>Disciplines</span>
        <span>État</span>
        <span />
      </div>

      <ol className="kov-list__body">
        {projects.map((project) => {
          const live = project.status === "live";
          const clickable = hasMore(project);

          return (
            <li key={project.id} className={`kov-list__row${live ? "" : " is-soon"}`}>
              <span className="kov-list__num">{project.id}</span>
              <span className="kov-list__name">{project.name}</span>
              <span className="kov-list__field">{project.category}</span>
              <span className="kov-list__tags">{project.tags.join(" / ")}</span>
              <span className="kov-list__state">
                <span aria-hidden="true" className={`kov-list__pip${live ? " is-live" : ""}`} />
                {live ? "En ligne" : "Non publié"}
              </span>
              <span className="kov-list__action">
                {clickable ? (
                  <button type="button" onClick={() => onOpen(project.id)}>
                    <span className="sr-only">{`Ouvrir ${project.name}`}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
