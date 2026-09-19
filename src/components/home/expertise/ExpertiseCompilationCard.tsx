import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ExpertiseVisual } from "./ExpertiseVisual";
import type { ExpertiseStep } from "./expertiseLayout";

// One card. Number, mark, title, one line, and a way in — the brief's whole
// content budget, and it is enough: six cards assembling on screen is already
// a lot to read, and paragraphs would make the composition unreadable at the
// moment it is meant to be legible at a glance.
//
// A Server Component. Its hover states are CSS on `.kov-xp-card`, and the
// sequence that positions it lives in the parent, so nothing here needs a
// client boundary.
export function ExpertiseCompilationCard({ step }: { step: ExpertiseStep }) {
  const strip = step.shape === "strip";

  return (
    <Link href="/#spotlight" className={`kov-xp-card${strip ? " kov-xp-card--strip" : ""}`}>
      <span aria-hidden="true" className="kov-xp-card__num">
        {step.number}
      </span>

      <span aria-hidden="true" className="kov-xp-card__visual">
        <ExpertiseVisual visual={step.visual} />
      </span>

      <span className="kov-xp-card__text">
        <span className="kov-xp-card__title">{step.title}</span>
        <span className="kov-xp-card__claim">{step.claim}</span>
        <span aria-hidden="true" className="kov-xp-card__cta">
          Explorer
          <ArrowRight size={12} strokeWidth={2} />
        </span>
      </span>
    </Link>
  );
}
