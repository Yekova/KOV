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
  /** Where the client is, shown under the name on /projets: "Talence,
   * 33400, Gironde". Null renders nothing.
   *
   * Empty on every entry today, and it has to stay that way until someone
   * who knows fills it in — a town and a postcode are facts about another
   * company, not something to infer from a logo. It is worth filling: a
   * real place under a real project is the strongest local signal this
   * site has, and the reference page prints one on every card. */
  location: string | null;
  /** The page itself, cropped clean, for the browser frame on /projets.
   * Null falls back to `image` — but `image` is sometimes a device mockup
   * (Kanti arrived as a laptop and a phone on a light ground), and a mockup
   * inside a browser frame is a mockup twice over. */
  screen: string | null;
  /** A screen recording of the work, shown in the project's modal on
   * /projets. width and height are the file's real pixel dimensions: the
   * modal reserves the box from them, so opening it never reflows.
   *
   * Null until something is actually filmed. The modal is then simply not
   * offered for that project — no empty player, no "vidéo bientôt". */
  video: {
    src: string;
    poster: string;
    width: number;
    height: number;
    /** "01:34". Shown on the thumbnail. Omitted, the thumbnail says nothing
     * about length rather than guessing at it. */
    duration?: string;
  } | null;
  /** A mark that pops out of the card's frame on hover. The client's own
   * logo where there is one and permission to use it; KOV's monogram for
   * KOV's own products. Null renders nothing. */
  hoverLogo: string | null;
  /** Extra real images of this project, for the modal's strip. Only files
   * that actually depict this work — never a neighbouring render pressed
   * into service to make a row of three. */
  gallery: readonly string[] | null;
  /** Measured, attributable figures for the modal's tiles: "+120% de trafic
   * qualifié", "48 pages livrées".
   *
   * Null on every entry, and it stays null until someone has the analytics
   * open in front of them. A number on a portfolio is a claim about another
   * company's business; there is no such thing as a plausible one. The tiles
   * simply do not render while this is null.
   *
   * `value` is the figure, `label` what it measures. Add a `source` here the
   * day one of these needs defending. */
  metrics: readonly { value: string; label: string }[] | null;
  /** A paragraph of real context: who the client is, what they do, what
   * they came with. The sheet is short on reading and this is the slot for
   * it — null renders nothing rather than filler. */
  brief: string | null;
  /** What was actually handed over, item by item: "Site vitrine 8 pages",
   * "Design system Figma", "Formation à l'administration". Facts about the
   * delivery, never figures about the client's business. Empty renders
   * nothing. */
  deliverables: readonly string[] | null;
  /** Something the client actually said, and who said it. Null until there
   * is a real quote from a real person who agreed to be named — an invented
   * testimonial is the single most damaging thing a page like this can
   * carry. */
  testimonial: { quote: string; author: string } | null;
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
    location: null,
    image: "/work/kanti-mockup.webp",
    // The laptop screen of the mockup above, extracted to its own content.
    screen: "/work/kanti-screen.webp",
    tagline: "Clarté et confiance",
    narrative: {
      problem: "Une offre patrimoniale complexe à structurer.",
      system: "Architecture, design system, responsive, contenu.",
      result: "Une expérience plus claire, cohérente et évolutive.",
    },
    brief: null,
    deliverables: null,
    // The client's own violet-on-white variant, supplied by them.
    hoverLogo: "/work/kanti-logo.png",
    gallery: ["/work/kanti-mockup.webp"],
    metrics: null,
    testimonial: null,
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
    location: null,
    // The Bureau's own bay window, cropped from its panorama. The Portal
    // render that was here showed the entrance; this shows why anyone would
    // walk through it.
    image: "/studio/covers/studio-cover.webp",
    // Already a render of the experience itself, not a device mockup, so it
    // goes straight into the frame.
    screen: null,
    // Six rooms, not seven: studioNodes.ts defines p01–p07 but only six
    // carry `available: true` and only six panoramas exist on disk. This
    // cannot be derived — studioNodes imports PROJECTS, so reading it back
    // here would be a cycle — so it has to be corrected by hand whenever a
    // room goes live.
    tagline: "Six salles à parcourir",
    narrative: {
      problem: "Montrer un studio sans photographier des bureaux.",
      system: "Panoramas 360°, navigation WebGL, plan interactif.",
      result: "Une visite qu'on parcourt au lieu d'une page qu'on lit.",
    },
    // Real crops of three of the rooms — the same files StudioShowcase
    // uses on the homepage, which is to say pictures of this exact project.
    brief: null,
    deliverables: null,
    // KOV's own product, so KOV's own monogram.
    hoverLogo: "/kov/brand/kov-monogram-k-transparent.png",
    gallery: [
      "/studio/covers/studio-detail-01.webp",
      "/studio/covers/studio-detail-02.webp",
      "/studio/covers/studio-detail-03.webp",
    ],
    metrics: null,
    testimonial: null,
    // The showreel was here and was removed by request: the strip above
    // shows the rooms, which is what the film showed.
    video: null,
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
    location: null,
    image: null,
    screen: null,
    tagline: null,
    narrative: null,
    brief: null,
    deliverables: null,
    hoverLogo: null,
    gallery: null,
    metrics: null,
    testimonial: null,
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
    location: null,
    image: null,
    screen: null,
    tagline: null,
    narrative: null,
    brief: null,
    deliverables: null,
    hoverLogo: null,
    gallery: null,
    metrics: null,
    testimonial: null,
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
    location: null,
    image: null,
    screen: null,
    tagline: null,
    narrative: null,
    brief: null,
    deliverables: null,
    hoverLogo: null,
    gallery: null,
    metrics: null,
    testimonial: null,
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
    location: null,
    image: null,
    screen: null,
    tagline: null,
    narrative: null,
    brief: null,
    deliverables: null,
    hoverLogo: null,
    gallery: null,
    metrics: null,
    testimonial: null,
    video: null,
    detail: null,
  },
];
