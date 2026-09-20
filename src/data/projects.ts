// Single source for every surface that lists KOV's work: the homepage's
// connected-projects network, the hero's project spotlight, KovProjectCard,
// and the Studio's P02 gallery walls (which reference entries 0-3 by index).
// Swapping a placeholder for a real project is a data change here, not a
// component change.
//
// A deliberate rule runs through this file: nothing claims to be finished
// work that isn't. `status: "upcoming"` entries carry no image and no
// destination, and consumers render an honest reserved state rather than a
// fabricated preview or a link to a page that doesn't exist.

export type ProjectStatus = "live" | "upcoming" | "invitation";

/** Problème → système → résultat, pour les projets qui ont réellement une
 *  histoire à raconter.
 *
 *  Un objet nullable unique, et non trois champs optionnels : la règle
 *  d'honnêteté est tout-ou-rien. Un récit à moitié rempli — un problème sans
 *  résultat — est exactement le rendu bricolé qu'on veut rendre impossible,
 *  alors le type le rend inexprimable.
 *
 *  Aucun chiffre ici tant qu'il n'est pas mesuré et attribuable. Le résultat
 *  est qualitatif par défaut, même règle que `image` et `href` : rien ne
 *  prétend exister avant d'exister. */
export interface ProjectNarrative {
  problem: string;
  system: string;
  result: string;
}

/** How a narrative is read out, in order. One definition: the homepage band
 *  and the /projets page both render from this, so the three labels cannot
 *  drift apart. */
export const NARRATIVE_ROWS = [
  { label: "Problème", key: "problem" },
  { label: "Système", key: "system" },
  { label: "Résultat", key: "result" },
] as const satisfies readonly { label: string; key: keyof ProjectNarrative }[];

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  category: string;
  tags: readonly string[];
  /** Set only once a project has a real journal entry to link to. */
  caseStudyHref: string | null;
  /** A real page this card opens. Null when no such route exists yet — the
   * card is then not a link at all, rather than pointing somewhere wrong. */
  href: string | null;
  /** Real asset under /public. Null for anything not yet photographed or
   * built; the card draws its own reserved panel instead. */
  image: string | null;
  /** Short line laid over the image. Kept to a few words. */
  tagline: string | null;
  /** Rendered by ProjectsProof below the grid. Null for anything without a
   * real story — those entries are simply absent from that band rather than
   * padded out with a placeholder. */
  narrative: ProjectNarrative | null;
  /** A screen recording of the work, shown in the project's modal on
   * /projets. width and height are the file's real pixel dimensions: the
   * modal reserves the box from them, so opening it never reflows.
   *
   * Null until something is actually filmed. The modal is then simply not
   * offered for that project — no empty player, no "vidéo bientôt". */
  video: { src: string; poster: string; width: number; height: number } | null;
  /** A longer description, for the modal only. The three narrative lines are
   * the summary the page itself carries; this is the room to say more once
   * there is more to say. Null renders nothing. */
  detail: string | null;
}

export const PROJECTS: Project[] = [
  {
    id: "01",
    name: "Kanti",
    status: "live",
    category: "Gestion de patrimoine",
    tags: ["Stratégie", "Design", "Développement"],
    caseStudyHref: null,
    // No public case-study route exists yet, so this card carries its work
    // without pretending to open one.
    href: null,
    image: "/work/kanti-mockup.webp",
    tagline: "Clarté et confiance",
    narrative: {
      problem: "Une offre patrimoniale complexe à structurer.",
      system: "Architecture, design system, responsive, contenu.",
      result: "Une expérience plus claire, cohérente et évolutive.",
    },
    video: null,
    detail: null,
  },
  {
    id: "02",
    name: "KOV Virtual Studio",
    status: "live",
    category: "Plateforme immersive",
    tags: ["Immersif", "360°", "Technologie"],
    caseStudyHref: null,
    href: "/studio",
    image: "/studio/covers/p01-cover.webp",
    // Five rooms, not seven: studioNodes.ts defines p01–p07 but only five
    // carry `available: true` and only five panoramas exist on disk. This
    // cannot be derived — studioNodes imports PROJECTS, so reading it back
    // here would be a cycle — so it has to be corrected by hand whenever a
    // room goes live.
    tagline: "Cinq salles à parcourir",
    narrative: {
      problem: "Montrer un studio sans photographier des bureaux.",
      system: "Panoramas 360°, navigation WebGL, plan interactif.",
      result: "Une visite qu'on parcourt au lieu d'une page qu'on lit.",
    },
    // Already in the repository, and already a recording of this very
    // project — StudioShowcase plays the same file on the homepage.
    video: {
      src: "/home/studio-showreel.mp4",
      poster: "/home/studio-showreel-poster.webp",
      width: 1280,
      height: 560,
    },
    detail: null,
  },
  {
    id: "03",
    name: "Projet 03",
    status: "upcoming",
    category: "Projet à venir",
    tags: ["Identité", "Expérience", "Développement"],
    caseStudyHref: null,
    href: null,
    image: null,
    tagline: null,
    narrative: null,
    video: null,
    detail: null,
  },
  {
    id: "04",
    name: "Projet 04",
    status: "upcoming",
    category: "Projet à venir",
    tags: ["Stratégie", "Design", "Motion"],
    caseStudyHref: null,
    href: null,
    image: null,
    tagline: null,
    narrative: null,
    video: null,
    detail: null,
  },
  {
    id: "05",
    name: "Projet 05",
    status: "upcoming",
    category: "Projet à venir",
    tags: ["Exploration", "Design", "Développement"],
    caseStudyHref: null,
    href: null,
    image: null,
    tagline: null,
    narrative: null,
    video: null,
    detail: null,
  },
  {
    // Not a project and not pretending to be one. The network's argument is
    // that every piece of work connects back to the same method — so the
    // sixth node is the reader's own, and it goes somewhere real.
    id: "06",
    name: "Votre projet",
    status: "invitation",
    category: "Parlons-en",
    tags: ["Stratégie", "Design", "Technologie"],
    caseStudyHref: null,
    href: "/contact",
    image: null,
    tagline: null,
    narrative: null,
    video: null,
    detail: null,
  },
];
