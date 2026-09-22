"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { isExternalHref, type Project } from "@/data/projects";
import { ProjectSheet, type SheetOrigin } from "./sheet/ProjectSheet";

/** How the same projects are laid out.
 *
 *  "grid" is two equal columns — the default, and the one that answers
 *  "what is here" fastest. "editorial" composes rows of different widths
 *  for a reading pass rather than a scanning one. "list" is the index. */
type View = "grid" | "editorial" | "list";

const VIEWS: readonly { id: View; label: string }[] = [
  { id: "grid", label: "Grille" },
  { id: "editorial", label: "Éditorial" },
  { id: "list", label: "Liste" },
];

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
export function ProjectsView({ projects }: { projects: Project[] }) {
  const [view, setView] = useState<View>("grid");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  // Where the card that was clicked sits on screen, so the sheet can grow
  // out of it rather than appear over it.
  const [origin, setOrigin] = useState<SheetOrigin | null>(null);

  const open = useCallback((slug: string, event: React.MouseEvent<HTMLElement>) => {
    const card = event.currentTarget.closest<HTMLElement>("[data-card]");
    if (card) {
      const rect = card.getBoundingClientRect();
      setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    } else {
      setOrigin(null);
    }
    setOpenSlug(slug);
  }, []);

  const delivered = useMemo(() => projects.filter((p) => p.status === "live"), [projects]);

  // What the page lists: the delivered work, then what is coming.
  //
  // Every upcoming entry that has something to say about itself shows in
  // full; the unnamed ones collapse to a single reserved card, because
  // three identical "À venir" tiles is padding, not a roadmap. The
  // invitation entry belongs to the homepage network and never appears
  // here — this page is the work, and the ask is already the footer.
  const listed = useMemo(() => {
    const coming = projects.filter((p) => p.status === "upcoming");
    const named = coming.filter((p) => p.summary);
    const reserved = coming.find((p) => !p.summary);
    return [...delivered, ...named, ...(reserved ? [reserved] : [])];
  }, [projects, delivered]);

  const upcoming = listed.length - delivered.length;

  const openProject = openSlug ? (projects.find((p) => p.slug === openSlug) ?? null) : null;

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

        {/* aria-pressed, not a set of links: this changes how the same
            content is displayed, it does not navigate anywhere. */}
        <div className="kov-pw__views" role="group" aria-label="Disposition des projets">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`kov-pw__view${view === option.id ? " is-on" : ""}`}
              aria-pressed={view === option.id}
              onClick={() => setView(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <ListView projects={listed} onOpen={open} />
      ) : (
        <GridView projects={listed} onOpen={open} composed={view === "editorial"} />
      )}

      {openProject && <ProjectSheet project={openProject} origin={origin} onClose={() => setOpenSlug(null)} />}
    </>
  );
}

/** Is this a position nobody has filled yet? An upcoming entry with
 *  nothing to say about itself — the page shows exactly one. */
const isReserved = (project: Project) => project.status === "upcoming" && !project.summary;

/** How the rows are composed, in twelfths of a row.
 *
 *  Cycled down the page, so the eye gets a different shape each time: the
 *  first project takes the whole row, the next two share it, then three,
 *  then a pair, then a wide one beside a narrow one. Every shape adds to
 *  twelve, so a row never leaves a hole in the middle of the page. */
const RHYTHM: readonly (readonly number[])[] = [[12], [6, 6], [4, 4, 4], [6, 6], [8, 4]];

/** What to use when fewer cards are left than the next shape wants. */
const FITS: Record<number, readonly number[]> = { 1: [12], 2: [6, 6], 3: [4, 4, 4] };

/** One span per card, in order.
 *
 *  The reserved position is taken out first and put back at four twelfths
 *  on the end: it is an empty frame, and widening an empty frame only
 *  makes a bigger empty frame. */
function spansFor(projects: Project[]): number[] {
  const reserved = projects.length > 0 && isReserved(projects[projects.length - 1]);
  const body = reserved ? projects.slice(0, -1) : projects;

  const spans: number[] = [];
  let row = 0;
  while (spans.length < body.length) {
    const left = body.length - spans.length;
    const cycled = RHYTHM[row % RHYTHM.length];
    const shape = cycled.length > left ? (FITS[left] ?? [12]) : cycled;
    spans.push(...shape);
    row += 1;
  }

  if (reserved) spans.push(4);
  return spans;
}

/** What Next should download for a card of this width. The grid caps at
 *  1500px, so the large end is a pixel figure rather than a viewport one —
 *  a 12-span card on a 2560px screen is still only 1400px of picture. */
const SIZES: Record<number, string> = {
  12: "(max-width: 899px) 92vw, (max-width: 1199px) 92vw, min(1400px, 62vw)",
  8: "(max-width: 899px) 92vw, (max-width: 1199px) 46vw, min(930px, 42vw)",
  6: "(max-width: 899px) 92vw, (max-width: 1199px) 46vw, min(690px, 31vw)",
  4: "(max-width: 899px) 92vw, (max-width: 1199px) 46vw, min(450px, 21vw)",
};

// ── Grid ─────────────────────────────────────────────────────────────────

function GridView({
  projects,
  onOpen,
  composed,
}: {
  projects: Project[];
  onOpen: (slug: string, event: React.MouseEvent<HTMLElement>) => void;
  /** False for the default grid: every card at six twelfths, which is two
   *  equal columns — the layout this page had before the rhythm existed,
   *  now one option among three rather than the only one. */
  composed: boolean;
}) {
  const spans = composed ? spansFor(projects) : projects.map(() => 6);

  return (
    <ul className="kov-pw__grid">
        {projects.map((project, index) => {
          const span = spans[index] ?? 6;
          // Tablet has room for halves, not thirds — see the media query
          // in ProjectsPage.css on why a third of 900px is a thumbnail.
          const spanMd = span === 12 ? 12 : 6;

          return (
          <li
            key={project.slug}
            id={`projet-${project.slug}`}
            className={`kov-card${composed && span === 12 ? " kov-card--feature" : ""}${
              composed && isReserved(project) ? " kov-card--reserved" : ""
            }`}
            style={{ ["--span" as string]: span, ["--span-md" as string]: spanMd }}
            data-card
          >
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
                    sizes={SIZES[span] ?? SIZES[6]}
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
                    onClick={(event) => onOpen(project.slug, event)}
                  >
                    <span className="kov-card__play">{project.video ? "▶" : "↗"}</span>
                  </button>
                )}

                {/* On the window, not under it.
                    
                    The picture is a browser frame showing the site, so the
                    corner of that frame is where "go and see it" belongs:
                    the visitor is already looking at the thing the button
                    opens. It sits above the shot's own click target, which
                    opens the study instead, so the two never contend for
                    the same pixel. */}
                {project.href &&
                  (isExternalHref(project.href) ? (
                    <a href={project.href} target="_blank" rel="noopener noreferrer" className="kov-card__visit">
                      Voir le projet
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <Link href={project.href} className="kov-card__visit">
                      Voir le projet
                      <span aria-hidden="true">→</span>
                    </Link>
                  ))}
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
                <button type="button" className="kov-card__link" onClick={(event) => onOpen(project.slug, event)}>
                  Voir l&apos;étude
                  <span aria-hidden="true">→</span>
                </button>
              )}
          </div>
        </li>
          );
        })}
    </ul>
  );
}

// ── List ─────────────────────────────────────────────────────────────────

function ListView({ projects, onOpen }: { projects: Project[]; onOpen: (slug: string, event: React.MouseEvent<HTMLElement>) => void }) {
  return (
    <div className="kov-list">
      <div aria-hidden="true" className="kov-list__head">
        <span />
        <span>#</span>
        <span>Projet</span>
        <span>Domaine</span>
        <span>Prestations</span>
        <span />
      </div>

      <ol className="kov-list__body">
        {projects.map((project) => (
          <li key={project.slug} className="kov-list__row">
            {/* The list had no picture in it at all, which made it an
                index of names rather than a second way of looking at the
                work. Same treatment as the cards: grey until the row is
                under the cursor. */}
            <span className="kov-list__thumb">
              {project.image ? (
                <Image
                  src={project.screen ?? project.image}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="132px"
                  className="kov-list__thumbImg"
                />
              ) : (
                <span aria-hidden="true" className="kov-list__thumbEmpty" />
              )}
            </span>
            <span className="kov-list__num">{project.id}</span>
            <span className="kov-list__name">{project.name}</span>
            <span className="kov-list__field">
              {project.category}
              {project.location && ` · ${project.location}`}
            </span>
            <span className="kov-list__tags">{project.status === "live" ? services(project).join(" — ") : ""}</span>
            <span className="kov-list__action">
              {openable(project) && (
                <button type="button" onClick={(event) => onOpen(project.slug, event)}>
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
