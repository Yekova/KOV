"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { PROJECTS, type Project } from "@/data/projects";
import { ProjectSheet, type SheetOrigin } from "./sheet/ProjectSheet";

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

/** Every delivered project opens a sheet now. It used to be gated on a film
 *  or a longer description, back when the modal held nothing the card did
 *  not already say; the sheet carries the hero, the strip, the method and
 *  the reasoning, so there is always something behind the click. */
const openable = (project: Project) => project.status === "live";

// The work, in two readings.
//
// Grid is the page: one light card per delivered project, each a browser
// window over a block of text — deliverables, name, place, and what was
// done. List is the same work as an index.
//
// Neither mentions unpublished work. projects.ts still carries the three
// placeholder entries, and the homepage grid still renders them as reserved
// tiles; this page is the showcase, and a showcase that announces what it
// does not have yet is counting down rather than showing.
//
// One modal for the whole page rather than one per project: two dialogs in
// the DOM to show one at a time is two of everything for no reason.
export function ProjectsView() {
  const [view, setView] = useState<View>("grid");
  const [openId, setOpenId] = useState<string | null>(null);
  // Where the card that was clicked sits on screen, so the sheet can grow
  // out of it rather than appear over it.
  const [origin, setOrigin] = useState<SheetOrigin | null>(null);

  const open = useCallback((id: string, event: React.MouseEvent<HTMLElement>) => {
    const card = event.currentTarget.closest<HTMLElement>("[data-card]");
    if (card) {
      const rect = card.getBoundingClientRect();
      setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    } else {
      setOrigin(null);
    }
    setOpenId(id);
  }, []);

  const delivered = useMemo(() => PROJECTS.filter((p) => p.status === "live"), []);

  // What the page lists: the delivered work, then what is coming.
  //
  // Every upcoming entry that has something to say about itself shows in
  // full; the unnamed ones collapse to a single reserved card, because
  // three identical "À venir" tiles is padding, not a roadmap. The
  // invitation entry belongs to the homepage network and never appears
  // here — this page is the work, and the ask is already the footer.
  const listed = useMemo(() => {
    const coming = PROJECTS.filter((p) => p.status === "upcoming");
    const named = coming.filter((p) => p.summary);
    const reserved = coming.find((p) => !p.summary);
    return [...delivered, ...named, ...(reserved ? [reserved] : [])];
  }, [delivered]);

  const upcoming = listed.length - delivered.length;

  const openProject = openId ? (PROJECTS.find((p) => p.id === openId) ?? null) : null;

  return (
    <>
      <div className="kov-pw__bar">
        {/* The count counts delivered work, and says separately what is
            on the way — a single number over a grid that also holds
            reserved cards would be counting the wrong thing. */}
        <p className="kov-pw__count">
          <b>{String(delivered.length).padStart(2, "0")}</b> réalisations
          {upcoming > 0 && (
            <>
              <span aria-hidden="true">·</span>
              {String(upcoming).padStart(2, "0")} à venir
            </>
          )}
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
        <GridView projects={listed} onOpen={open} />
      ) : (
        <ListView projects={listed} onOpen={open} />
      )}

      {openProject && <ProjectSheet project={openProject} origin={origin} onClose={() => setOpenId(null)} />}
    </>
  );
}

// ── Grid ─────────────────────────────────────────────────────────────────

function GridView({ projects, onOpen }: { projects: Project[]; onOpen: (id: string, event: React.MouseEvent<HTMLElement>) => void }) {
  return (
    <ul className="kov-pw__grid">
        {projects.map((project) => (
          <li key={project.id} id={`projet-${project.id}`} className="kov-card" data-card>
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

                {openable(project) && (
                  // A redundant pointer affordance, out of the tab order and
                  // hidden from assistive tech: the same action already has
                  // a labelled button below. Clicking a large picture still
                  // has to work.
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    className="kov-card__shotHit"
                    onClick={(event) => onOpen(project.id, event)}
                  >
                    <span className="kov-card__play">{project.video ? "▶" : "↗"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Three of the project's own mark, breaking out of the frame
                on hover. Purely decorative and entirely aria-hidden: the
                name is right below in real text. They sit on the card
                rather than in the window, because the window clips. */}
            {project.hoverLogo && (
              <span aria-hidden="true" className="kov-card__pops">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`kov-card__pop kov-card__pop--${i + 1}`}>
                    <Image src={project.hoverLogo!} alt="" fill sizes="140px" className="kov-card__popImg" />
                  </span>
                ))}
              </span>
            )}

            <div className="kov-card__text">
              {/* What was actually built, before the name — the reference's
                  own order, and the right one: a prospect is looking for
                  their own job on this line. */}
              {/* Only for delivered work. On a project that has not
                  shipped, a line of deliverables under the heading
                  "prestations" is a claim about work nobody has done —
                  the summary below says what the thing is instead. */}
              {project.status === "live" && (
                <p className="kov-card__services">
                  {services(project).map((item, index) => (
                    <span key={item}>
                      {index > 0 && <span aria-hidden="true"> — </span>}
                      {item}
                    </span>
                  ))}
                </p>
              )}

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

              {project.narrative ? (
                <p className="kov-card__body">
                  {project.narrative.problem} {project.narrative.result}
                </p>
              ) : (
                project.summary && <p className="kov-card__body">{project.summary}</p>
              )}

              {openable(project) && (
                <button type="button" className="kov-card__link" onClick={(event) => onOpen(project.id, event)}>
                  Voir le projet
                  <span aria-hidden="true">→</span>
                </button>
              )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── List ─────────────────────────────────────────────────────────────────

function ListView({ projects, onOpen }: { projects: Project[]; onOpen: (id: string, event: React.MouseEvent<HTMLElement>) => void }) {
  return (
    <div className="kov-list">
      <div aria-hidden="true" className="kov-list__head">
        <span>#</span>
        <span>Projet</span>
        <span>Domaine</span>
        <span>Prestations</span>
        <span />
      </div>

      <ol className="kov-list__body">
        {projects.map((project) => (
          <li key={project.id} className="kov-list__row">
            <span className="kov-list__num">{project.id}</span>
            <span className="kov-list__name">{project.name}</span>
            <span className="kov-list__field">
              {project.category}
              {project.location && ` · ${project.location}`}
            </span>
            <span className="kov-list__tags">{project.status === "live" ? services(project).join(" — ") : ""}</span>
            <span className="kov-list__action">
              {openable(project) && (
                <button type="button" onClick={(event) => onOpen(project.id, event)}>
                  <span className="sr-only">{`Ouvrir ${project.name}`}</span>
                  <span aria-hidden="true">→</span>
                </button>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
