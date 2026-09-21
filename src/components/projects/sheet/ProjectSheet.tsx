"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Project } from "@/data/projects";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { toSheet } from "./sheetData";
import { SheetHero } from "./SheetHero";
import { SheetNarrative } from "./SheetNarrative";
import { SheetStats } from "./SheetStats";
import { SheetGallery } from "./SheetGallery";
import { SheetVideo } from "./SheetVideo";
import { SheetProcess } from "./SheetProcess";
import { SheetCTA } from "./SheetCTA";
import "./ProjectSheet.css";

/** Where on screen the card that opened this sits, so the sheet can grow
 *  out of it rather than appear over it. */
export interface SheetOrigin {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// A project, read as a short case study.
//
// A native <dialog>, because it is the one place the platform already
// implements the whole contract: focus moves in and is trapped, Escape
// closes, the rest of the page goes inert, the top layer means no z-index
// in this codebase can paint over it, and focus returns to the control
// that opened it. None of that is reimplemented here.
//
// Portalled to <body> and rendered only once open, so nothing is
// server-rendered and there is no hydration question about document.body.
export function ProjectSheet({
  project,
  origin,
  onClose,
}: {
  project: Project;
  origin: SheetOrigin | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  const data = toSheet(project);
  const titleId = `sheet-title-${data.id}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    lockScroll();
    // The page blurs itself, for engines that ignore backdrop-filter on
    // ::backdrop. The sheet lives in the top layer and is not a descendant
    // of anything this touches, so it stays sharp.
    document.documentElement.classList.add("kov-sheet-open");
    return () => {
      document.documentElement.classList.remove("kov-sheet-open");
      unlockScroll();
      if (dialog.open) dialog.close();
    };
  }, []);

  // The opening. Not a true morph — a sheet and a 16:9 card have nothing
  // like the same proportions, and interpolating between them distorts
  // everything inside. What sells the same idea without the distortion is
  // growing from the card's own point on screen: the transform origin is
  // the card's centre, expressed against the panel's box.
  //
  // useLayoutEffect, so the origin is set before the first paint; the
  // transition then runs off a class applied on the next frame, which is
  // deterministic in a way that racing a CSS animation is not.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (origin) {
      const rect = panel.getBoundingClientRect();
      panel.style.transformOrigin = `${clamp(origin.x - rect.left, 0, rect.width)}px ${clamp(
        origin.y - rect.top,
        0,
        rect.height
      )}px`;
    }

    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [origin]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  // A click that lands on the dialog element rather than on its panel is a
  // click on the backdrop. Native dialogs do not close on that, and people
  // expect them to.
  const handleBackdrop = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === dialogRef.current) onClose();
    },
    [onClose]
  );

  return createPortal(
    <dialog
      ref={dialogRef}
      className="ps"
      onClose={handleClose}
      onClick={handleBackdrop}
      aria-labelledby={titleId}
      // Lenis, stopped, calls preventDefault() on every wheel and touch
      // event on the page — see its onVirtualScroll: the isStopped branch
      // cancels the event and returns. Locking the page behind the sheet
      // therefore also cancelled scrolling inside it, which read as the
      // pointer passing straight through the popup.
      //
      // This attribute is the library's own escape hatch, and it is
      // checked one branch earlier than isStopped: anything originating
      // inside this element is handed back to the browser and scrolls
      // natively.
      data-lenis-prevent
    >
      <div ref={panelRef} className={`ps__panel${entered ? " is-in" : ""}`}>
        {/* Sticky, so the way out never scrolls away. */}
        <header className="ps__bar">
          <p className="ps__crumb">
            <span aria-hidden="true">{data.id}</span>
            <span aria-hidden="true" className="ps-slash">
              /
            </span>
            Projet
          </p>

          <button type="button" className="ps__close" onClick={onClose} aria-label="Fermer">
            <X size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </header>

        {/* Each section fades up a beat after the one above it — the stagger
            is CSS delays on .is-in, so no JavaScript watches the sequence. */}
        <div className="ps__flow">
          <SheetHero data={data} titleId={titleId} />
          <SheetNarrative data={data} />
          <SheetStats data={data} />
          <SheetGallery data={data} />
          <SheetVideo data={data} />
          <SheetProcess data={data} />
          <SheetCTA data={data} />
        </div>
      </div>
    </dialog>,
    document.body
  );
}
