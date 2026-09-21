import { PROCESS } from "@/data/processSteps";
import type { Project } from "@/data/projects";

// The one shape the sheet and everything under it reads.
//
// The sheet's components never see a Project. They see this, which is the
// brief's own field list — so nothing downstream knows where a value came
// from, no component hardcodes a project, and the day the data model moves
// there is exactly one function to change.

export interface SheetStat {
  value: string;
  label: string;
}

export interface SheetVideo {
  src: string;
  poster: string;
  width: number;
  height: number;
  duration?: string;
}

export interface ProjectSheetData {
  id: string;
  title: string;
  sector: string;
  tagline: string | null;
  /** The one short line beside the hero. Never a paragraph. */
  description: string | null;
  tags: readonly string[];
  heroImage: string | null;
  /** A paragraph of context under the hero, before the three columns. */
  brief: string | null;
  /** What was handed over. Facts about the delivery, never figures about
   *  the client's business. */
  deliverables: readonly string[];
  context: string | null;
  response: string | null;
  impact: string | null;
  /** Measured, attributable figures only. Empty means the band does not
   *  render — never a plausible-looking number in its place. */
  stats: readonly SheetStat[];
  gallery: readonly string[];
  video: SheetVideo | null;
  process: readonly { number: string; title: string }[];
  websiteUrl: string | null;
  caseStudyUrl: string | null;
  quote: { text: string; author: string } | null;
}

export function toSheet(project: Project): ProjectSheetData {
  return {
    id: project.id,
    title: project.name,
    sector: project.category,
    tagline: project.tagline,
    // `detail` is the long-form text when one is written. Falling back to
    // the problem keeps the hero to a single sentence either way — the
    // brief is explicit that no paragraph belongs beside the title.
    description: project.detail ?? project.narrative?.problem ?? null,
    // Three at most beside the hero. Both projects carry exactly three;
    // the slice is here so a fourth never quietly crowds the column.
    tags: project.tags.slice(0, 3),
    heroImage: project.screen ?? project.image,
    brief: project.brief,
    // Never derived from `system`: that sentence is already the narrative's
    // middle column, and splitting it into chips two blocks later would be
    // the same words twice.
    deliverables: project.deliverables ?? [],
    context: project.narrative?.problem ?? null,
    response: project.narrative?.system ?? null,
    impact: project.narrative?.result ?? null,
    stats: project.metrics ?? [],
    gallery: project.gallery ?? [],
    video: project.video,
    // KOV's own seven steps. Real, documented, and the same on every
    // project — which is why the sheet labels this the method rather than
    // a plan drawn up for this client.
    process: PROCESS.map((step) => ({ number: step.number, title: step.title })),
    websiteUrl: project.href,
    caseStudyUrl: project.caseStudyHref,
    quote: project.testimonial ? { text: project.testimonial.quote, author: project.testimonial.author } : null,
  };
}
