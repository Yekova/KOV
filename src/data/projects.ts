// Shared by the homepage's WorkGallery (grid) and WorkSpotlight (featured
// project) — previously each hardcoded its own copy of Kanti independently,
// which meant a tag or category change had to be made twice. `caseStudyHref`
// is null until a project has a real journal entry to link to; consumers
// should render an honest "bientôt" state rather than a link to a page that
// doesn't exist. Swapping a placeholder for a real project is a data change
// here, not a component change.
export const PROJECTS = [
  {
    id: "01",
    name: "Kanti",
    status: "live",
    category: "Gestion de patrimoine",
    tags: ["Stratégie", "Design", "Développement"],
    caseStudyHref: null,
  },
  {
    id: "02",
    name: "Projet 02",
    status: "upcoming",
    category: "Projet à venir",
    tags: ["Exploration", "Design", "Développement"],
    caseStudyHref: null,
  },
  {
    id: "03",
    name: "Projet 03",
    status: "upcoming",
    category: "Projet à venir",
    tags: ["Identité", "Expérience", "Développement"],
    caseStudyHref: null,
  },
  {
    id: "04",
    name: "Projet 04",
    status: "upcoming",
    category: "Projet à venir",
    tags: ["Stratégie", "Design", "Motion"],
    caseStudyHref: null,
  },
] as const;
