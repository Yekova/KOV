// Shared by /expertise (full page) and the nav's Expertise dropdown, so the
// two never drift — one is the canonical list, the other a preview of it.
export const PILLARS = [
  {
    number: "01",
    slug: "strategie",
    title: "Stratégie",
    body: "Positionnement, architecture et parcours utilisateur. Avant de dessiner une interface, on décide ce qu'elle doit dire, à qui et pourquoi.",
  },
  {
    number: "02",
    slug: "design",
    title: "Design",
    body: "On conçoit des interfaces comme on construit une architecture — la structure vient avant le style. Le design clarifie et guide ; il ne masque jamais un problème de fond.",
  },
  {
    number: "03",
    slug: "developpement",
    title: "Développement",
    body: "Le design n'est pas une maquette qu'on remet à quelqu'un d'autre. On construit en code réel, avec une attention portée à la performance et à ce qui se passe une fois que les vrais utilisateurs arrivent.",
  },
  {
    number: "04",
    slug: "motion",
    title: "Motion",
    body: "Le mouvement a une fonction. Une transition guide, explique, révèle ou crée une émotion — si elle n'apporte rien, elle disparaît.",
  },
  {
    number: "05",
    slug: "systemes",
    title: "Systèmes",
    body: "Un site ne doit pas devenir une contrainte quand l'entreprise grandit. On conçoit une architecture capable d'évoluer, d'accueillir du nouveau contenu et de rester maintenable dans le temps.",
  },
  {
    number: "06",
    slug: "integration",
    title: "Intégration",
    body: "Le site n'est pas une façade isolée. CRM, données, formulaires et automatisations doivent fonctionner ensemble pour former un véritable système numérique.",
  },
] as const;
