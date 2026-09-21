"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { PROJECTS, type Project } from "@/data/projects";
import { ProjectModal } from "./ProjectModal";

type View = "grid" | "list";

/** What the address pill shows. Derived from the project's own href, never
 *  written by hand: a plausible-looking domain in a browser frame is a
 *  claim, and a project with no public URL gets a blank pill instead. */
function browserUrl(href: string | null): string | null {
  if (!href) return null;
  if (href.startsWith("/")) return `kov-agency.site${href}`;
  try {
    const parsed = new URL(href);
    return `${parsed.host}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
}

/** The line of deliverables above each name.
 *
 *  Taken from the project's own `system` line rather than written fresh —
 *  "Architecture, design system, responsive, contenu" is already the list of
 *  what was built, it is already reviewed copy, and splitting it means the
 *  card and the modal can never end up claiming different work. */
function services(project: Project): string[] {
  if (!project.narrative) return [...project.tags];
  return project.narrative.system
    .replace(/\.$/, "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    // The source is a sentence, so everything after the first item arrives
    // lowercase. These are deliverables in a list, not prose.
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
}

/** Whether there is anything behind a click: a film, or a longer
 *  description. Everything else is already printed on the card. */
const hasMore = (project: Project) => Boolean(project.video || project.detail);

// The work, in two readings.
//
// Grid is the page: one light card per delivered project, each a browser
// window over a block of text — deliverables, name, place, and what was
// done. List is the same work as an index, and it includes what is not
// published, because an index is exactly where the incomplete belongs and a
// showcase is exactly where it does not.
//
// One modal for the whole page rather than one per project: two dialogs in
// the DOM to show one at a time is two of everything for no reason.
export function ProjectsView() {
  const [view, setView] = useState<View>("grid");
  const [openId, setOpenId] = useState<string | null>(null);

  const delivered = useMemo(() => PROJECTS.filter((p) => p.status === "live"), []);
  const upcoming = useMemo(() => PROJECTS.filter((p) => p.status === "upcoming"), []);
  const indexed = useMemo(() => [...delivered, ...upcoming], [delivered, upcoming]);

  const openProject = openId ? (PROJECTS.find((p) => p.id === openId) ?? null) : null;

  return (
    <>
      <div className="kov-pw__bar">
        <p className="kov-pw__count">
          <b>{String(delivered.length).padStart(2, "0")}</b> en ligne
          <span aria-hidden="true">/</span>
          <b>{String(upcoming.length).padStart(2, "0")}</b> à venir
        </p>

        {/* aria-pressed, not a pair of links: this changes how the same
            content is displayed, it does not navigate anywhere. */}
        <div className="kov-pw__views" role="group" aria-label="Affichage des projets">
          <button
            type="button"
            className={`kov-pw__view${view === "grid" ? " is-on" : ""}`}
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            Vignettes
          </button>
          <button
            type="button"
            className={`kov-pw__view${view === "list" ? " is-on" : ""}`}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            Liste
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <GridView projects={delivered} upcoming={upcoming} onOpen={setOpenId} />
      ) : (
        <ListView projects={indexed} onOpen={setOpenId} />
      )}

      {openProject && <ProjectModal project={openProject} open onClose={() => setOpenId(null)} />}
    </>
  );
}

// ── Grid ─────────────────────────────────────────────────────────────────

function GridView({
  projects,
  upcoming,
  onOpen,
}: {
  projects: Project[];
  upcoming: Project[];
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <ul className="kov-pw__grid">
        {projects.map((project) => (
          <li key={project.id} id={`projet-${project.id}`} className="kov-card">
            <div className="kov-card__window">
              <BrowserChrome tone="light" url={browserUrl(project.href)} />

              <div className="kov-card__shot">
                {project.image ? (
                  // Cropped at the bottom on purpose: a page that ends
                  // exactly at the frame reads as a picture of a page, one
                  // that runs past it reads as a page.
                  <Image
                    src={project.screen ?? project.image}
                    alt={`${project.name} — ${project.category}`}
                    fill
                    sizes="(max-width: 1023px) 92vw, 46vw"
                    className="kov-card__img"
                  />
                ) : (
                  <span className="kov-card__reserved">Visuel à venir</span>
                )}

                {project.video && (
                  // A redundant pointer affordance, out of the tab order and
                  // hidden from assistive tech: the same action already has
                  // a labelled button below. Clicking a large picture still
                  // has to work.
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    className="kov-card__shotHit"
                    onClick={() => onOpen(project.id)}
                  >
                    <span className="kov-card__play">▶</span>
                  </button>
                )}
              </div>
            </div>

            <div className="kov-card__text">
              {/* What was actually built, before the name — the reference's
                  own order, and the right one: a prospect is looking for
                  their own job on this line. */}
              <p className="kov-card__services">
                {services(project).map((item, index) => (
                  <span key={item}>
                    {index > 0 && <span aria-hidden="true"> — </span>}
                    {item}
                  </span>
                ))}
              </p>

              <h2 className="kov-card__name">{project.name}</h2>

              <p className="kov-card__where">
                {project.category}
                {project.location && (
                  <>
                    <span aria-hidden="true"> · </span>
                    {project.location}
                  </>
                )}
              </p>

              {project.narrative && (
                <p className="kov-card__body">
                  {project.narrative.problem} {project.narrative.result}
                </p>
              )}

              {hasMore(project) && (
                <button type="button" className="kov-card__link" onClick={() => onOpen(project.id)}>
                  {project.video ? "Voir la vidéo" : "En savoir plus"}
                  <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {upcoming.length > 0 && (
        <section className="kov-soon" aria-labelledby="projets-a-venir">
          <div className="kov-soon__head">
            <h2 id="projets-a-venir" className="kov-soon__title">
              À venir
            </h2>
            {/* Says only what the data records: not published. No reserved
                cards, no "Bientôt" plates — the worst tell of a thin
                portfolio is empty frames dressed up as work. */}
            <p className="kov-soon__note">
              {upcoming.length} projets qui ne sont pas encore en ligne. Ils rejoindront cette page quand ils le
              seront.
            </p>
          </div>

          <ol className="kov-soon__list">
            {upcoming.map((project) => (
              <li key={project.id} className="kov-soon__row">
                <span aria-hidden="true" className="kov-soon__num">
                  {project.id}
                </span>
                <span className="kov-soon__tags">
                  {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </span>
                <span className="kov-soon__state">Non publié</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
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
        <span>Prestations</span>
        <span>État</span>
        <span />
      </div>

      <ol className="kov-list__body">
        {projects.map((project) => {
          const live = project.status === "live";

          return (
            <li key={project.id} className={`kov-list__row${live ? "" : " is-soon"}`}>
              <span className="kov-list__num">{project.id}</span>
              <span className="kov-list__name">{project.name}</span>
              <span className="kov-list__field">
                {project.category}
                {project.location && ` · ${project.location}`}
              </span>
              <span className="kov-list__tags">{services(project).join(" — ")}</span>
              <span className="kov-list__state">
                <span aria-hidden="true" className={`kov-list__pip${live ? " is-live" : ""}`} />
                {live ? "En ligne" : "Non publié"}
              </span>
              <span className="kov-list__action">
                {hasMore(project) && (
                  <button type="button" onClick={() => onOpen(project.id)}>
                    <span className="sr-only">{`Ouvrir ${project.name}`}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
