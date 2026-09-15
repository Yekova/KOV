"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

interface TourStep {
  /** `data-tour` value of the element this step points at. Omitted for the
   * opening step, which is about the panorama itself — the whole screen. */
  target?: string;
  title: string;
  body: string;
}

// Ordered the way a visitor actually meets the studio: the room in front of
// them first, then the panel naming it, then the ways out of it, then the
// extras. Every step points at something real, so a step whose control
// isn't on screen (the map on a phone, for instance) is dropped rather than
// highlighting nothing.
const TOUR_STEPS: TourStep[] = [
  {
    title: "Regardez autour de vous",
    body: "Cliquez et faites glisser pour explorer la salle à 360°. La molette rapproche ou éloigne la vue, et les points lumineux dans la scène ouvrent un projet ou mènent à une autre salle.",
  },
  {
    target: "room-panel",
    title: "La salle où vous êtes",
    body: "Son nom, ce qu'on y trouve, et les gestes disponibles. Les flèches en haut passent à la salle précédente ou suivante.",
  },
  {
    target: "rooms",
    title: "Toutes les salles",
    body: "Survolez une vignette pour voir de quelle salle il s'agit, cliquez pour vous y rendre directement. Le point rouge marque celle où vous vous trouvez.",
  },
  {
    target: "music",
    title: "L'ambiance sonore",
    body: "Sortez le lecteur pour mettre une musique de fond. Elle continue quand vous changez de salle.",
  },
  {
    target: "map",
    title: "Le plan du studio",
    body: "Une maquette 3D du bâtiment, en coupe. Faites-la pivoter à la souris, ou agrandissez-la pour parcourir chaque salle en détail.",
  },
  {
    target: "hand",
    title: "Diriger la vue à la main",
    body: "Activez votre caméra pour piloter la vue d'un geste : pincez le pouce et l'index puis déplacez la main pour tourner, avancez ou reculez la main pour zoomer. Rien ne quitte votre navigateur.",
  },
  {
    target: "fullscreen",
    title: "Plein écran",
    body: "Pour une immersion complète, sans le reste du navigateur autour.",
  },
];

/** Breathing room left around a highlighted element. */
const HALO_PADDING = 10;
const CARD_WIDTH = 330;
/** Used only to decide whether the card fits below its target; the card's
 * real height varies with its copy. */
const CARD_HEIGHT_ESTIMATE = 220;
const EDGE_MARGIN = 16;

interface Measurement {
  rect: DOMRect | null;
  vw: number;
  vh: number;
}

interface StudioTourProps {
  onClose: () => void;
}

// A guided pass over the studio's controls: everything dims and blurs
// except the one thing being described, which keeps its own pixels and
// gains a halo.
//
// The dimming is four bands around the highlighted rectangle rather than
// one masked layer. A mask would avoid the faint seam where two bands meet,
// but `backdrop-filter` under a CSS mask is the kind of thing that renders
// beautifully in one browser and not at all in another — and a tour that
// fails to cut its hole shows the visitor a blurred smear where the point
// was supposed to be. Four rectangles work everywhere.
export function StudioTour({ onClose }: StudioTourProps) {
  // Resolved once, at mount: a step whose control isn't in the DOM has
  // nothing to point at, so it isn't part of this tour.
  const [steps] = useState(() =>
    TOUR_STEPS.filter((step) => !step.target || document.querySelector(`[data-tour="${step.target}"]`))
  );
  const [index, setIndex] = useState(0);
  const [measurement, setMeasurement] = useState<Measurement>({ rect: null, vw: 0, vh: 0 });

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, onClose]);

  const previous = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") previous();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, previous, onClose]);

  useEffect(() => {
    const target = step?.target;
    function measure() {
      const el = target ? document.querySelector(`[data-tour="${target}"]`) : null;
      setMeasurement({
        rect: el ? el.getBoundingClientRect() : null,
        vw: window.innerWidth,
        vh: window.innerHeight,
      });
    }
    // Measured on the next frame rather than synchronously: targets that
    // fade themselves in (the map does) are mid-transition at this point,
    // and a rect read too early can be the wrong one.
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [step?.target]);

  if (!step) return null;

  const { rect, vw, vh } = measurement;
  const hole =
    rect && rect.width > 0
      ? {
          top: Math.max(0, rect.top - HALO_PADDING),
          left: Math.max(0, rect.left - HALO_PADDING),
          width: rect.width + HALO_PADDING * 2,
          height: rect.height + HALO_PADDING * 2,
        }
      : null;

  const scrim = {
    position: "fixed" as const,
    background: "rgba(5,5,5,0.72)",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
  };

  // Below the target when there's room for the card there, above it
  // otherwise, and horizontally centred on the target but never past the
  // edge of the screen.
  let cardStyle: React.CSSProperties;
  if (!hole || vw === 0) {
    cardStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  } else {
    const below = hole.top + hole.height + 14;
    const fitsBelow = below + CARD_HEIGHT_ESTIMATE < vh - EDGE_MARGIN;
    const left = Math.min(
      Math.max(hole.left + hole.width / 2 - CARD_WIDTH / 2, EDGE_MARGIN),
      Math.max(vw - CARD_WIDTH - EDGE_MARGIN, EDGE_MARGIN)
    );
    cardStyle = fitsBelow
      ? { top: below, left }
      : { bottom: Math.max(vh - hole.top + 14, EDGE_MARGIN), left };
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visite guidée du studio"
      className="fixed inset-0"
      style={{ zIndex: "var(--z-modal)" }}
      onClick={next}
    >
      {hole ? (
        <>
          <div style={{ ...scrim, top: 0, left: 0, right: 0, height: hole.top }} />
          <div style={{ ...scrim, top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div style={{ ...scrim, top: hole.top, left: 0, width: hole.left, height: hole.height }} />
          <div style={{ ...scrim, top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          <div
            aria-hidden="true"
            className="fixed pointer-events-none"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              borderRadius: 14,
              border: "1px solid var(--kov-red)",
              boxShadow: "0 0 0 1px rgba(227,30,36,0.25), 0 0 34px rgba(227,30,36,0.35)",
            }}
          />
        </>
      ) : (
        <div style={{ ...scrim, inset: 0 }} />
      )}

      <div
        className="fixed p-5"
        style={{
          ...cardStyle,
          width: CARD_WIDTH,
          maxWidth: "calc(100vw - 32px)",
          borderRadius: 16,
          background: "rgba(10,10,11,0.96)",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[10px] text-kov-red tracking-widest">
            {String(index + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la visite guidée"
            className="text-kov-steel hover:text-kov-bone transition-colors -mt-1 -mr-1"
          >
            <X size={14} />
          </button>
        </div>

        <p className="font-display text-kov-bone uppercase text-base leading-tight mt-2.5">{step.title}</p>
        <p className="text-kov-steel text-[13px] leading-relaxed mt-2">{step.body}</p>

        {/* One segment per step — the visitor can see how long this is
            before deciding whether to sit through it. */}
        <div aria-hidden="true" className="flex items-center gap-1 mt-4">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className="h-0.5 flex-1"
              style={{ background: i <= index ? "var(--kov-red)" : "rgba(255,255,255,0.12)", borderRadius: 1 }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-kov-steel hover:text-kov-bone transition-colors text-[10px] uppercase tracking-widest"
          >
            Passer
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={previous}
                className="px-3 py-2 text-kov-bone text-[10px] uppercase tracking-widest transition-colors hover:text-kov-white"
                style={{ borderRadius: "var(--radius-pill)", border: "1px solid var(--glass-border)" }}
              >
                Retour
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="group px-4 py-2 flex items-center gap-2 text-kov-white text-[10px] uppercase tracking-widest"
              style={{ borderRadius: "var(--radius-pill)", background: "var(--kov-red)" }}
            >
              {isLast ? "Commencer la visite" : "Suivant"}
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                →
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
