"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { NARRATIVE_ROWS, type Project } from "@/data/projects";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

// The project in detail: the film, and the reasoning around it.
//
// A native <dialog>, not a div with role="dialog". The element is the one
// place the platform already implements the whole contract correctly — focus
// moves in and is trapped, Escape closes, the rest of the page goes inert,
// and the top layer means no z-index in this codebase can ever paint over
// it. Every hand-rolled modal in /admin reimplements a slice of that and
// none of them traps focus.
//
// The <video> exists only while the dialog is open. A 7 MB file that is
// mounted but hidden is a 7 MB file the browser may still decide to fetch,
// and this page carries one per project.
//
// Portalled to <body>, and the whole thing renders only once open. Each case
// sits inside a Reveal, which puts a transform on its <li>; the top layer is
// specified to ignore ancestor transforms, but that corner has a long enough
// history of browser bugs that a portal is cheaper than finding out. It also
// means the server renders nothing at all here — no dialog, no player, and
// no hydration question about document.body existing.
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
    // runs an effect's cleanup, so by the time the cleanup below fires the
    // <video> has already been unmounted and videoRef.current is null —
    // reading it there would silently skip the pause and leave a film
    // playing, with audio, behind a closed dialog.
    const video = videoRef.current;

    if (!dialog.open) dialog.showModal();
    lockScroll();

    return () => {
      unlockScroll();
      // Rewinding as well as pausing, so reopening starts from the first
      // frame rather than mid-shot.
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      if (dialog.open) dialog.close();
    };
  }, [open]);

  // Escape and the backdrop both fire the dialog's own close event; this is
  // what keeps React's state in step with what the platform just did.
  const handleClose = useCallback(() => {
    if (open) onClose();
  }, [open, onClose]);

  // A click that lands on the dialog element itself rather than on its panel
  // is a click on the backdrop. Native dialogs do not close on backdrop
  // click, and people expect them to.
  const handleBackdrop = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === dialogRef.current) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={handleBackdrop}
      className="kov-modal"
      aria-labelledby={`modal-title-${project.id}`}
    >
      <div className="kov-modal__panel">
        <button type="button" onClick={onClose} className="kov-modal__close" aria-label="Fermer">
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>

        {project.video && (
          // The box is reserved from the file's real dimensions, so the
          // panel is its final size before a single frame has loaded.
          <div
            className="kov-modal__video"
            style={{ aspectRatio: `${project.video.width} / ${project.video.height}` }}
          >
            <video
              ref={videoRef}
              src={project.video.src}
              poster={project.video.poster}
              controls
              playsInline
              preload="metadata"
              className="kov-modal__player"
            />
          </div>
        )}

        <div className="kov-modal__body">
          <p className="kov-modal__meta">
            <span aria-hidden="true" className="kov-modal__index">
              {project.id}
            </span>
            {project.category}
          </p>

          <h2 id={`modal-title-${project.id}`} className="kov-modal__title">
            {project.name}
          </h2>

          {project.detail && <p className="kov-modal__detail">{project.detail}</p>}

          <dl className="kov-modal__story">
            {project.narrative &&
              NARRATIVE_ROWS.map((row) => (
                <div key={row.key}>
                  <dt>{row.label}</dt>
                  <dd>{project.narrative?.[row.key]}</dd>
                </div>
              ))}
          </dl>

          <div className="kov-modal__actions">
            {project.href && (
              <Link href={project.href} className="kov-case__link kov-case__link--primary">
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
      </div>
    </dialog>,
    document.body
  );
}
