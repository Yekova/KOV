// One real page per offer previously listed only as an inert tag on
// /expertise ("Ce qu'on construit"). `focus` cross-references expertisePillars
// slugs, for a small "disciplines impliquées" row on each service page.
export const SERVICES = [
  {
    slug: "sites-corporate",
    title: "Sites corporate",
    tagline: "La vitrine d'une entreprise, pensée comme un système, pas comme un dépliant numérique.",
    description:
      "Un site corporate KOV n'est pas une suite de pages avec un menu — c'est une architecture d'information qui reflète comment l'entreprise pense vraiment, avec un design qui tient dans le temps plutôt qu'une tendance qui datera dans deux ans.",
    focus: ["strategie", "design", "developpement"],
  },
  {
    slug: "sites-immersifs",
    title: "Sites immersifs",
    tagline: "Le scroll comme narration, pas comme simple défilement de contenu.",
    description:
      "Pour les marques qui veulent marquer plutôt qu'informer : motion et mise en scène pensées scène par scène, avec une séparation stricte entre le monde visuel et le contenu HTML — pour rester rapide, accessible et lisible par les moteurs de recherche malgré l'ambition visuelle.",
    focus: ["motion", "design", "developpement"],
  },
  {
    slug: "applications-web",
    title: "Applications web",
    tagline: "Du code de production, pas un prototype qui traîne en interne.",
    description:
      "Applications métier, outils internes, plateformes — construites avec la même rigueur qu'un site public : une architecture pensée pour évoluer, une interface pensée pour les utilisateurs qui s'en serviront tous les jours.",
    focus: ["developpement", "systemes", "integration"],
  },
  {
    slug: "dashboards",
    title: "Dashboards",
    tagline: "Lire l'essentiel en un coup d'œil, pas fouiller dans des tableaux.",
    description:
      "Des interfaces de pilotage où l'information importante saute aux yeux — statuts, échéances, indicateurs — construites pour les décisions du quotidien, pas pour impressionner une fois en démo.",
    focus: ["design", "systemes"],
  },
  {
    slug: "espaces-clients",
    title: "Espaces clients",
    tagline: "Un espace que les clients ouvrent vraiment, pas un portail qu'on subit.",
    description:
      "Suivi de projet, documents, factures, échanges — centralisés dans un espace pensé comme un vrai produit, pas comme un module ajouté après coup à un site vitrine.",
    focus: ["design", "developpement", "systemes"],
  },
  {
    slug: "systemes-numeriques",
    title: "Systèmes numériques",
    tagline: "Des outils connectés, pas des silos qui se répondent par export CSV.",
    description:
      "CRM, facturation, automatisations — reliés au reste du système numérique de l'entreprise, pour que le site soit la façade de quelque chose qui tourne vraiment.",
    focus: ["integration", "systemes"],
  },
] as const;
