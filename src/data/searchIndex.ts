// Static search index — a hand-written map of real site content, not a real
// full-text/backend search. Good enough as a first version; if content grows
// enough that this goes stale, generate it from the actual page content
// instead of hand-maintaining it further.

import { SERVICES } from "@/data/services";

export interface SearchItem {
  title: string;
  category: "Expertise" | "Studio" | "Projets" | "Contact";
  href: string;
  description: string;
  keywords?: string[];
}

export const searchIndex: SearchItem[] = [
  {
    title: "Stratégie",
    category: "Expertise",
    href: "/expertise",
    description: "Positionnement, structure et parcours utilisateurs — décidés avant de designer quoi que ce soit.",
  },
  {
    title: "Design",
    category: "Expertise",
    href: "/expertise",
    description: "Des interfaces pensées comme de l'architecture. La structure d'abord, le style ensuite.",
  },
  {
    title: "Développement",
    category: "Expertise",
    href: "/expertise",
    description: "Du code de production dès le premier jour, conçu pour tenir face au vrai trafic.",
  },
  {
    title: "Motion",
    category: "Expertise",
    href: "/expertise",
    description: "Un mouvement qui explique, jamais qui joue un rôle.",
  },
  {
    title: "Systèmes",
    category: "Expertise",
    href: "/expertise",
    description: "Une architecture numérique conçue pour évoluer.",
  },
  {
    title: "Intégration",
    category: "Expertise",
    href: "/expertise",
    description: "Outils, données et automatisations, connectés.",
    keywords: ["crm", "automatisation", "api"],
  },
  {
    title: "Notre processus",
    category: "Expertise",
    href: "/expertise",
    description: "Sept étapes : Découvrir, Structurer, Design, Développer, Motion, Lancer, Évoluer.",
    keywords: ["comment travaillez-vous", "processus", "méthodologie"],
  },
  {
    title: "Ce qu'on construit",
    category: "Expertise",
    href: "/expertise",
    description: "Sites corporate, sites immersifs, applications web, dashboards, espaces clients, systèmes numériques.",
    keywords: ["services", "quels services proposez-vous", "crm", "application web"],
  },
  ...SERVICES.map((service) => ({
    title: service.title,
    category: "Expertise" as const,
    href: `/expertise/${service.slug}`,
    description: service.tagline,
  })),
  {
    title: "FAQ",
    category: "Contact",
    href: "/faq",
    description: "Délais, processus, budget, maintenance — les réponses aux questions fréquentes.",
    keywords: ["questions", "faq", "combien ça coûte", "combien de temps"],
  },
  {
    title: "Kanti — Gestion de patrimoine",
    category: "Projets",
    href: "/#work-gallery",
    description: "Stratégie, design et développement pour une expérience numérique de gestion de patrimoine.",
    keywords: ["étude de cas", "projet", "portfolio", "montrez-moi vos projets"],
  },
  {
    title: "Philosophie",
    category: "Studio",
    href: "/studio",
    description: "Le bon design n'a pas besoin de crier. Clarté, intention, impact.",
  },
  {
    title: "Petit par choix",
    category: "Studio",
    href: "/studio",
    description: "Moins de niveaux hiérarchiques, plus d'implication, un meilleur travail — qui est KOV.",
    keywords: ["à propos", "équipe", "qui êtes-vous"],
  },
  {
    title: "Démarrer un projet",
    category: "Contact",
    href: "/contact",
    description: "Dites-nous ce que vous construisez.",
    keywords: ["nous contacter", "devis", "contact"],
  },
];
