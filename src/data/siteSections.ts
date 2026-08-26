// The site's real core sections — used by the global overview menu. Utility
// pages (/login, /legal, /privacy, /terms) are deliberately excluded, same
// reasoning searchIndex.ts already applies: this is core marketing content,
// not every route that exists.
//
// `image` feeds the InfiniteMenu sphere (GlobalOverviewMenu) — all 5 are
// dedicated architectural renders the user supplied specifically for this
// (self-hosted under public/kov/menu/, not hotlinked), one per section.
export const SITE_SECTIONS = [
  {
    href: "/",
    label: "Accueil",
    description: "L'entrée du studio.",
    image: "/kov/menu/atrium-brutaliste.jpg",
  },
  {
    href: "/expertise",
    label: "Expertise",
    description: "Stratégie, design, développement, motion, systèmes, intégration.",
    image: "/kov/menu/bureau-moderne.jpg",
  },
  {
    href: "/studio",
    label: "Studio",
    description: "Qui on est, comment on travaille.",
    image: "/kov/menu/studio-industriel.jpg",
  },
  {
    href: "/journal",
    label: "Journal",
    description: "Études de cas et notes de studio.",
    image: "/kov/menu/galerie-futuriste.jpg",
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Démarrer un projet avec KOV.",
    image: "/kov/menu/couloir-brutaliste.jpg",
  },
] as const;
