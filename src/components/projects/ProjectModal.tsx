"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { PROCESS } from "@/data/processSteps";
import { NARRATIVE_ROWS, type Project } from "@/data/projects";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

// The project sheet.
//
// A native <dialog>, not a div with role="dialog". The element is the one
// place the platform already implements the whole contract correctly: focus
// moves in and is trapped, Escape closes, the rest of the page goes inert,
// and the top layer means no z-index in this codebase can paint over it.
//
// Portalled to <body> and rendered only once open, so nothing here is
// server-rendered and there is no hydration question about document.body.
//
// Every block below is conditional on real data. The reference this is
// modelled on carries four figure tiles, a client testimonial, a country, a
// year, a page count and a PDF case study — none of which is recorded
// anywhere for these projects. The slots exist and stay empty rather than
// being filled with plausible numbers: a figure on a portfolio is a claim
// about somebody else's business.
export function ProjectModal({
  project,
  open,
  onClose,
}: {
  project: Project;
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    // Captured here, while it still exists. React commits the DOM before it
    // runs an effect's cleanup, so by then the <video> is unmounted and the
    // ref is null — reading it there would silently skip the pause and
    // leave a film playing, with audio, behind a closed dialog.
    const video = videoRef.current;

    if (!dialog.open) dialog.showModal();
    lockScroll();

    return () => {
      unlockScroll();
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      if (dialog.open) dialog.close();
    };
  }, [open]);

  // Escape and the platform's own close both fire this; it is what keeps
  // React's state in step with what the dialog just did.
  const handleClose = useCallback(() => {
    if (open) onClose();
  }, [open, onClose]);

  // A click that lands on the dialog element rather than on its panel is a
  // click on the backdrop. Native dialogs do not close on that, and people
  // expect them to.
  const handleBackdrop = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === dialogRef.current) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  const titleId = `sheet-title-${project.id}`;

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={handleBackdrop}
      className="kov-sheet"
      aria-labelledby={titleId}
    >
      <div className="kov-sheet__panel">
        <button type="button" onClick={onClose} className="kov-sheet__close" aria-label="Fermer">
          <X size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>

        <header className="kov-sheet__bar">
          <p className="kov-sheet__crumb">
            <span aria-hidden="true">{project.id}</span>
            <span aria-hidden="true" className="kov-sheet__slash">
              /
            </span>
            Projet
          </p>
          <p aria-hidden="true" className="kov-sheet__sig">
            Des idées plus loin
            <span className="kov-sheet__sigRule" />
            KOV
          </p>
        </header>

        <div className="kov-sheet__grid">
          {/* ── Left: the work itself ─────────────────────────────── */}
          <div className="kov-sheet__left">
            <div className="kov-sheet__hero">
              {project.image ? (
                <Image
                  src={project.image}
                  alt={`${project.name} — ${project.category}`}
                  fill
                  sizes="(max-width: 1023px) 92vw, 54vw"
                  className="kov-sheet__heroImg"
                />
              ) : (
                <span className="kov-sheet__reserved">Visuel à venir</span>
              )}

              <span aria-hidden="true" className="kov-sheet__heroVeil" />

              <p aria-hidden="true" className="kov-sheet__heroTags">
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </p>

              <p aria-hidden="true" className="kov-sheet__heroMark">
                {project.name}
              </p>

              {project.tagline && <p className="kov-sheet__heroStatement">{project.tagline}</p>}

              <p aria-hidden="true" className="kov-sheet__heroFoot">
                <span className="kov-sheet__heroRule" />
                <span>{project.category}</span>
                {project.location && <span className="kov-sheet__heroWhere">{project.location}</span>}
              </p>
            </div>

            {/* A film, when one exists. Neither project has one today, so
                this renders for nobody — the strip below carries the work
                instead. */}
            {project.video && (
              <div
                className="kov-sheet__film"
                style={{ aspectRatio: `${project.video.width} / ${project.video.height}` }}
              >
                <video
                  ref={videoRef}
                  src={project.video.src}
                  poster={project.video.poster}
                  controls
                  playsInline
                  preload="metadata"
                  className="kov-sheet__player"
                />
              </div>
            )}

            {project.gallery && project.gallery.length > 0 && (
              <ul className="kov-sheet__strip">
                {project.gallery.map((src) => (
                  <li key={src}>
                    <Image
                      src={src}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="180px"
                      className="kov-sheet__stripImg"
                    />
                  </li>
                ))}
              </ul>
            )}

            {/* KOV's own seven steps, from processSteps.ts — the method,
                applied. Labelled as the method rather than as this
                project's bespoke plan, because that is what it is. */}
            <section className="kov-sheet__steps" aria-label="La méthode appliquée">
              <p className="kov-sheet__label">La méthode appliquée</p>
              <ol>
                {PROCESS.map((step) => (
                  <li key={step.number}>
                    <span aria-hidden="true" className="kov-sheet__stepDot" />
                    <span className="kov-sheet__stepNum">{step.number}</span>
                    <span className="kov-sheet__stepName">{step.title}</span>
                  </li>
                ))}
              </ol>
            </section>

            {/* Renders for nobody today, and should: an invented
                testimonial is the single most damaging thing a page like
                this can carry. */}
            {project.testimonial && (
              <figure className="kov-sheet__quote">
                <span aria-hidden="true" className="kov-sheet__quoteMark">
                  &laquo;
                </span>
                <blockquote>{project.testimonial.quote}</blockquote>
                <figcaption>— {project.testimonial.author}</figcaption>
              </figure>
            )}
          </div>

          {/* ── Right: what it is, and what was done ──────────────── */}
          <div className="kov-sheet__right">
            <p className="kov-sheet__eyebrow">
              <span aria-hidden="true" className="kov-sheet__eyebrowNum">
                {project.id}
              </span>
              <span aria-hidden="true" className="kov-sheet__slash">
                /
              </span>
              {project.category}
            </p>

            <h2 id={titleId} className="kov-sheet__title">
              {project.name}
            </h2>

            {project.detail ? (
              <p className="kov-sheet__body">{project.detail}</p>
            ) : (
              project.narrative && (
                <p className="kov-sheet__body">
                  {project.narrative.problem} {project.narrative.result}
                </p>
              )
            )}

            {/* Four tiles in the reference, all four invented. They appear
                the day projects.ts carries measured figures, and not
                before. */}
            {project.metrics && project.metrics.length > 0 && (
              <ul className="kov-sheet__metrics">
                {project.metrics.map((metric) => (
                  <li key={metric.label}>
                    <span className="kov-sheet__metricValue">{metric.value}</span>
                    <span className="kov-sheet__metricLabel">{metric.label}</span>
                  </li>
                ))}
              </ul>
            )}

            {project.narrative && (
              <section className="kov-sheet__story" aria-label="Le raisonnement">
                <p className="kov-sheet__label">Le raisonnement</p>
                <dl>
                  {NARRATIVE_ROWS.map((row) => (
                    <div key={row.key}>
                      <dt>{row.label}</dt>
                      <dd>{project.narrative?.[row.key]}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section className="kov-sheet__skills" aria-label="Nos expertises sur ce projet">
              <p className="kov-sheet__label">Nos expertises sur ce projet</p>
              <ul>
                {project.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </section>

            {/* Both conditional, both pointing only at routes that exist.
                Kanti has neither today and shows neither, rather than a
                disabled button or a PDF that was never written. */}
            {(project.href || project.caseStudyHref) && (
              <div className="kov-sheet__actions">
                {project.href && (
                  <Link href={project.href} className="kov-sheet__cta kov-sheet__cta--primary">
                    Voir le projet
                    <span aria-hidden="true">↗</span>
                  </Link>
                )}
                {project.caseStudyHref && (
                  <Link href={project.caseStudyHref} className="kov-sheet__cta">
                    Lire l&apos;étude de cas
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            )}

            <p aria-hidden="true" className="kov-sheet__sign">
              Des idées qui prennent vie.
              <span className="kov-sheet__sigRule" />
              KOV
            </p>
          </div>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
