"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { NARRATIVE_ROWS, type Project } from "@/data/projects";
import { ProjectModal } from "./ProjectModal";

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

// One delivered project, shown the way it is actually used: a window, on a
// stage, turned slightly toward the reader.
//
// These are websites. A cropped photograph of one is a picture of a website;
// a window with chrome around it is the website. The frame is the site's own
// BrowserChrome, already used by the homepage's ScreenShowcase, so the two
// surfaces show work in the same language.
//
// The reasoning stays on the page beside it — problem, system, result, in
// real HTML — rather than behind the modal, which is reserved for the film
// and the longer description.
export function ProjectCase({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);

  // Offered where there is something more to show. A modal that only
  // repeated the three lines already beside it would be a door onto the
  // same room.
  const hasModal = Boolean(project.video || project.detail);
  const openModal = () => setOpen(true);

  // `screen` is the page cropped to its own content; `image` may be a device
  // mockup, and a mockup inside a browser frame is a mockup twice over.
  const shot = project.screen ?? project.image;

  return (
    <>
      <div className="kov-vit__stage">
        <div className="kov-vit__window">
          <BrowserChrome url={browserUrl(project.href)} className="kov-vit__chrome" />

          <div className="kov-vit__screen">
            {shot ? (
              <Image
                src={shot}
                alt={`${project.name} — ${project.category}`}
                fill
                sizes="(max-width: 1023px) 96vw, 56vw"
                className="kov-vit__img"
              />
            ) : (
              // A delivered project with nothing captured yet gets a
              // reserved panel, never a stand-in screenshot.
              <span className="kov-vit__reserved">Capture à venir</span>
            )}

            {/* A redundant pointer affordance, deliberately out of the tab
                order and hidden from assistive tech: the same action already
                has a real labelled button in the column beside it, and
                offering it twice would be two tab stops and two
                announcements for one thing. Clicking a window that shows a
                play badge still has to work. */}
            {hasModal && (
              <button
                type="button"
                aria-hidden="true"
                tabIndex={-1}
                className="kov-vit__screenHit"
                onClick={openModal}
              >
                {project.video && (
                  <span className="kov-vit__play">
                    <Play size={18} strokeWidth={2} fill="currentColor" />
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <span aria-hidden="true" className="kov-vit__floor" />
      </div>

      <div className="kov-vit__text">
        <p className="kov-vit__meta">
          <span aria-hidden="true" className="kov-vit__num">
            {project.id}
          </span>
          <span aria-hidden="true" className="kov-vit__rule" />
          {project.category}
        </p>

        <h2 className="kov-vit__name">{project.name}</h2>

        {project.tagline && <p className="kov-vit__tagline">{project.tagline}</p>}

        {project.narrative && (
          // <dl> is the element for label→value pairs, and assistive tech
          // handles it well. Always visible, never behind a disclosure.
          <dl className="kov-vit__story">
            {NARRATIVE_ROWS.map((row) => (
              <div key={row.key}>
                <dt>{row.label}</dt>
                <dd>{project.narrative?.[row.key]}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="kov-vit__foot">
          <ul className="kov-vit__tags">
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>

          {hasModal && (
            <button type="button" onClick={openModal} className="kov-vit__cta">
              {project.video ? "Voir la vidéo" : "En savoir plus"}
              <span aria-hidden="true" className="kov-vit__cta-arrow">
                ↗
              </span>
            </button>
          )}
        </div>
      </div>

      {hasModal && <ProjectModal project={project} open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
