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
  },
  {
    id: "02",
    name: "KOV Virtual Studio",
    status: "live",
    category: "Plateforme immersive",
    tags: ["Immersif", "360°", "Technologie"],
    caseStudyHref: null,
    href: "/studio",
    image: "/studio/thumbnails/p02.webp",
    tagline: "Sept salles à parcourir",
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
  },
];
