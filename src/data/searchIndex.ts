import { PILLARS } from "@/data/expertisePillars";

// The site's own search index.
//
// It used to be hand-written, and the file said so: "if content grows enough
// that this goes stale, generate it from the actual page content instead of
// hand-maintaining it further." It went stale. Eight of its fifteen entries
// pointed at /#expertise, an anchor on the homepage, from the period when
// the six /expertise/<slug> pages did not exist. They exist again, and the
// search was still sending people to a fragment. It also knew nothing about
// the journal or about the two commercial pages, so a visitor typing
// "création de site" into the site's own search did not find the page built
// for exactly that.
//
// So the expertise entries are derived from PILLARS now rather than typed
// out: a seventh discipline appears in search by existing, and a renamed
// slug cannot leave a dead link behind. The fixed pages below are listed by
// hand because there is nothing to derive them from, and they are few.
//
// Articles are deliberately not here. They live in the database and change
// without a deploy, so searchKov fetches them (see src/lib/search.ts). A
// list of articles frozen into the client bundle would be the same mistake
// this file is being repaired for.

export interface SearchItem {
  title: string;
  category: "Expertise" | "Studio" | "Projets" | "Journal" | "Contact";
  href: string;
  description: string;
  keywords?: string[];
}

// `tagline` rather than the long lede from expertiseDetail: this array ships
// in the client bundle, and pulling two thousand words of prose into it to
// populate a search dropdown would cost far more than it returns.
const EXPERTISE: SearchItem[] = PILLARS.map((pillar) => ({
  title: pillar.title,
  category: "Expertise",
  href: `/expertise/${pillar.slug}`,
  description: pillar.tagline,
}));

const PAGES: SearchItem[] = [
  {
    title: "Création de site internet",
    category: "Expertise",
    href: "/creation-site-internet",
    description: "Ce que recouvre une création sur mesure, ce qui fait varier un projet, et ce que vous recevez.",
    keywords: ["création de site web", "refonte", "sur mesure", "prix", "budget", "devis"],
  },
  {
    title: "Agence web à Bordeaux",
    category: "Expertise",
    href: "/agence-web-bordeaux",
    description: "Le studio depuis sa ville : ce que la proximité change, et ce qu'elle ne change pas.",
    keywords: ["bordeaux", "gironde", "local", "agence", "rendez-vous"],
  },
  {
    title: "Toutes nos expertises",
    category: "Expertise",
    href: "/expertise",
    description: "Les six métiers réunis, et ce que chacun décide dans un projet.",
    keywords: ["processus", "méthodologie", "comment travaillez-vous"],
  },
  {
    title: "Réalisations",
    category: "Projets",
    href: "/projets",
    description: "Les projets livrés et ceux en cours.",
    keywords: ["portfolio", "références", "clients", "cas"],
  },
  {
    title: "Journal",
    category: "Journal",
    href: "/journal",
    description: "Études de cas et notes de studio : le raisonnement derrière le travail.",
    keywords: ["blog", "articles", "notes"],
  },
  {
    title: "Studio virtuel",
    category: "Studio",
    href: "/studio",
    description: "Un lieu à parcourir en 360°, plutôt qu'une page à lire.",
    keywords: ["360", "immersif", "webgl", "3d", "visite"],
  },
  {
    title: "FAQ",
    category: "Contact",
    href: "/faq",
    description: "Délais, budget, technique, suivi : cinquante réponses aux questions qu'on nous pose.",
    keywords: ["questions", "délais", "budget", "maintenance"],
  },
  {
    title: "Démarrer un projet",
    category: "Contact",
    href: "/contact",
    description: "Dites-nous où vous en êtes. On revient avec une lecture du problème avant de parler design.",
    keywords: ["contact", "devis", "rendez-vous", "écrire"],
  },
];

export const searchIndex: SearchItem[] = [...EXPERTISE, ...PAGES];
