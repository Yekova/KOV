"use client";

import Image from "next/image";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { PROCESS_PANELS } from "./processPanels";
import { ProcessVisual } from "./ProcessVisual";
import "./ProcessGallery.css";

// The seven steps as an accordion gallery: one panel open, six folded down to
// a spine with the step's name running up it.
//
// One DOM for both forms, not two branches. The stylesheet turns the same
// markup into a row of vertical spines above 1024px and an ordinary stacked
// accordion below it — so the seven steps are in the page exactly once, for a
// crawler and for a screen reader, and nothing has to be kept in sync between
// a desktop copy and a mobile one.
//
// Hover opens a panel only where hovering means something. On a touch screen
// `mouseenter` fires on tap, immediately before `click`, and the two together
// would open a panel and then close it again; `(hover: hover) and (pointer:
// fine)` is the question that separates the two cases.
export function ProcessGallery() {
  // -1 is "everything closed", reachable by tapping an open panel on touch.
  const [active, setActive] = useState(0);
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  // A pointer device never sees an empty gallery: the row is sized for one
  // open panel, and with none open it would be seven spines and a gap. This
  // also covers the odd path into that state — a phone opened, closed and
  // then rotated onto a hover-capable breakpoint.
  const openIndex = canHover && active < 0 ? 0 : active;

  return (
    <ol className="kov-proc-gallery">
      {PROCESS_PANELS.map((panel, index) => {
        const isOpen = index === openIndex;
        const regionId = `process-step-${panel.number}`;

        return (
          <li key={panel.number} className={`kov-proc-panel${isOpen ? " is-open" : ""}`}>
            {/* inert for the same reason as the text region below, and for
                one that has not arrived yet: the drawings are decoration and
                already aria-hidden, but a real photograph dropped into
                processPanels carries alt text, and a folded panel must not
                read it out. */}
            <div className="kov-proc-panel__frame" inert={!isOpen}>
              <div className="kov-proc-panel__frameInner">
                <div className="kov-proc-panel__plate">
                  {panel.image ? (
                    <Image
                      src={panel.image.src}
                      alt={panel.image.alt}
                      fill
                      sizes="(max-width: 1023px) 92vw, 62vw"
                      className="kov-proc-photo"
                    />
                  ) : (
                    <ProcessVisual visual={panel.visual} />
                  )}
                </div>
              </div>
            </div>

            <div className="kov-proc-panel__content">
              <div className="kov-proc-panel__label">
                <span aria-hidden="true" className="kov-proc-panel__num">
                  {panel.number}
                </span>
                <h3 className="kov-proc-panel__title">{panel.title}</h3>
                <span aria-hidden="true" className="kov-proc-panel__sign" />
              </div>

              {/* inert rather than only hidden: below 1024px a closed region
                  is a zero-height grid row whose text is still in the
                  accessibility tree and still in the tab order. It stays in
                  the DOM either way, which is what keeps it readable to a
                  crawler. */}
              <div className="kov-proc-panel__reveal" id={regionId} inert={!isOpen}>
                <div className="kov-proc-panel__revealInner">
                  <p className="kov-proc-panel__artefact">{panel.artefact}</p>
                  <p className="kov-proc-panel__body">{panel.body}</p>
                </div>
              </div>
            </div>

            {/* The control is a button laid over the panel rather than a
                button wrapping it: the panel holds an <h3> and a <p>, and
                neither is allowed inside a <button>. Above 1024px it covers
                the whole panel while folded and steps out of the way once
                open, so the paragraph you are reading stays selectable. */}
            <button
              type="button"
              className="kov-proc-panel__hit"
              aria-expanded={isOpen}
              aria-controls={regionId}
              aria-label={`Étape ${panel.number} — ${panel.title}`}
              onMouseEnter={canHover ? () => setActive(index) : undefined}
              onFocus={() => setActive(index)}
              onClick={() => setActive((prev) => (prev === index && !canHover ? -1 : index))}
            />
          </li>
        );
      })}
    </ol>
  );
}
