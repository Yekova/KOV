import { PROCESS } from "@/data/processSteps";

export type ProcessVisualKey =
  | "discover"
  | "structure"
  | "design"
  | "build"
  | "motion"
  | "launch"
  | "evolve";

export interface ProcessPanel {
  number: string;
  title: string;
  body: string;
  /** Three or four words naming what the step leaves behind. Shown in the
   *  open panel, above the title. */
  artefact: string;
  visual: ProcessVisualKey;
  /** A real photograph, when there is one.
   *
   *  There is not one today: the repository holds no imagery of these seven
   *  steps, and every photograph in public/ is already spoken for elsewhere
   *  on this same page — the menu interiors run the FAQ, the search panel and
   *  siteSections, the studio covers run StudioShowcase and two hero widgets.
   *  Borrowing one of those would make the homepage repeat itself while
   *  showing something that has nothing to do with the step it sits behind.
   *
   *  So each panel draws its own artefact instead (see ProcessVisual). Fill
   *  this in and the drawing steps aside for the photograph — that is the
   *  only change needed. */
  image: { src: string; alt: string } | null;
}

type StepNumber = (typeof PROCESS)[number]["number"];

// Keyed by number rather than by array position: "01".."07" are the stable
// identifiers in processSteps.ts, and a Record typed against them means
// adding or renaming a step fails the build instead of silently shifting
// every visual one panel to the left.
const PANELS: Record<StepNumber, { artefact: string; visual: ProcessVisualKey }> = {
  "01": { artefact: "Cadrage", visual: "discover" },
  "02": { artefact: "Architecture", visual: "structure" },
  "03": { artefact: "Direction artistique", visual: "design" },
  "04": { artefact: "Code de production", visual: "build" },
  "05": { artefact: "Motion", visual: "motion" },
  "06": { artefact: "Mise en ligne", visual: "launch" },
  "07": { artefact: "Suivi", visual: "evolve" },
};

export const PROCESS_PANELS: ProcessPanel[] = PROCESS.map((step) => ({
  number: step.number,
  title: step.title,
  body: step.body,
  ...PANELS[step.number],
  image: null,
}));
