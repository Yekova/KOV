// The site's real core sections — used by the global overview menu. Utility
// pages (/login, /legal, /privacy, /terms) are deliberately excluded, same
// reasoning searchIndex.ts already applies: this is core marketing content,
// not every route that exists.
export const SITE_SECTIONS = [
  {
    href: "/",
    label: "Accueil",
    description: "L'entrée du studio.",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    href: "/expertise",
    label: "Expertise",
    description: "Stratégie, design, développement, motion, systèmes, intégration.",
    span: "md:col-span-2",
  },
  {
    href: "/studio",
    label: "Studio",
    description: "Qui on est, comment on travaille.",
    span: "md:row-span-2",
  },
  {
    href: "/journal",
    label: "Journal",
    description: "Études de cas et notes de studio.",
    span: "",
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Démarrer un projet.",
    span: "",
  },
] as const;
