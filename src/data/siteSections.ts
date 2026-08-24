// The site's real core sections — used by the global overview menu. Utility
// pages (/login, /legal, /privacy, /terms) are deliberately excluded, same
// reasoning searchIndex.ts already applies: this is core marketing content,
// not every route that exists. `image` is only set where a real, existing
// KOV asset actually fits the section (Accueil's corridor shot) — the rest
// render as a stylized gradient tile rather than a fabricated photoreal
// scene; see the note in GlobalOverviewMenu.tsx.
export const SITE_SECTIONS = [
  {
    href: "/",
    label: "Accueil",
    description: "L'entrée du studio.",
    image: "/kov/character/contact-frames/frame-015.jpg",
  },
  {
    href: "/expertise",
    label: "Expertise",
    description: "Stratégie, design, développement, motion, systèmes, intégration.",
  },
  {
    href: "/studio",
    label: "Studio",
    description: "Qui on est, comment on travaille.",
  },
  {
    href: "/journal",
    label: "Journal",
    description: "Études de cas et notes de studio.",
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Démarrer un projet avec KOV.",
  },
] as const;
