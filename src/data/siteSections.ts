// The site's real core sections — used by the global overview menu. Utility
// pages (/login, /legal, /privacy, /terms) are deliberately excluded, same
// reasoning searchIndex.ts already applies: this is core marketing content,
// not every route that exists.
//
// `image` feeds the InfiniteMenu sphere (GlobalOverviewMenu) — each is a
// real, already-existing repo asset, not a fabricated per-section photo (no
// clean 1:1 photo exists for 5 abstract sections, so these lean on the
// brand's own recurring corridor/character motif already used elsewhere:
// particle-source.jpg is the current Hero background, the two contact-frames
// are already reused as the /admin and /client backgrounds, login-frames is
// the /login sequence, and hero-01-establishing.png is a real unused
// keyframe from the same shoot).
export const SITE_SECTIONS = [
  {
    href: "/",
    label: "Accueil",
    description: "L'entrée du studio.",
    image: "/kov/home/particle-source.jpg",
  },
  {
    href: "/expertise",
    label: "Expertise",
    description: "Stratégie, design, développement, motion, systèmes, intégration.",
    image: "/kov/character/contact-frames/frame-015.jpg",
  },
  {
    href: "/studio",
    label: "Studio",
    description: "Qui on est, comment on travaille.",
    image: "/kov/keyframes/hero-01-establishing.png",
  },
  {
    href: "/journal",
    label: "Journal",
    description: "Études de cas et notes de studio.",
    image: "/kov/character/login-frames/frame-030.jpg",
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Démarrer un projet avec KOV.",
    image: "/kov/character/contact-frames/frame-040.jpg",
  },
] as const;
