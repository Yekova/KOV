// Shared by /expertise (full page) and the nav's Expertise dropdown, so the
// two never drift — one is the canonical list, the other a preview of it.
export const PILLARS = [
  {
    number: "01",
    slug: "strategie",
    title: "Stratégie",
    body: "Positionnement, structure et parcours utilisateurs — décidés avant même de commencer à designer quoi que ce soit.",
  },
  {
    number: "02",
    slug: "design",
    title: "Design",
    body: "Des interfaces pensées comme de l'architecture. La structure d'abord, le style ensuite — jamais l'inverse pour masquer une mauvaise structure.",
  },
  {
    number: "03",
    slug: "developpement",
    title: "Développement",
    body: "Du code de production dès le premier jour. Rapide, précis, conçu pour tenir face aux vrais utilisateurs et au vrai trafic.",
  },
  {
    number: "04",
    slug: "motion",
    title: "Motion",
    body: "Un mouvement qui explique, jamais qui joue un rôle. Chaque transition existe pour communiquer quelque chose — ou n'existe pas.",
  },
  {
    number: "05",
    slug: "systemes",
    title: "Systèmes",
    body: "Une architecture numérique conçue pour évoluer — pas un site figé qui casse dès que l'activité grandit.",
  },
  {
    number: "06",
    slug: "integration",
    title: "Intégration",
    body: "Outils, données et automatisations, connectés — pour que le site soit la façade de quelque chose qui tourne vraiment.",
  },
] as const;
