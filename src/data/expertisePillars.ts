// Shared by /expertise (full page) and the nav's Expertise dropdown, so the
// two never drift — one is the canonical list, the other a preview of it.
//
// Two description fields, deliberately, doing two different jobs:
//
//   tagline — the promise. One short sentence saying what the discipline is
//             FOR. It is the single line each card of the homepage's
//             #expertise sequence carries, and it also feeds the hero's
//             expertise widget. It used to hold poetic noun phrases
//             ("Éclairer les possibles") that read well but told a visitor
//             nothing about the result they get.
//   body    — the method. The longer paragraph, canonical on /expertise.
//             Only the largest homepage tile shows it; the others would
//             clamp it to three lines anyway.
//
// `slug` and the array ORDER are load-bearing. The order is the order the
// #expertise sequence assembles in, and every slug is a key in that section's
// LAYOUT map (expertise/expertiseLayout.ts), which is typed against this list
// — so a renamed slug fails the build rather than losing a card. services.ts
// `focus` and ActivationWindow's links resolve against them too. Rewriting
// copy is safe; reordering is not.
export const PILLARS = [
  {
    number: "01",
    slug: "strategie",
    title: "Stratégie",
    tagline: "Comprendre avant de construire.",
    body: "Positionnement, architecture et parcours utilisateur. Avant de dessiner une interface, on décide ce qu'elle doit dire, à qui et pourquoi.",
  },
  {
    number: "02",
    slug: "design",
    title: "Design",
    tagline: "Créer une identité que l'on reconnaît.",
    body: "On conçoit des interfaces comme on construit une architecture : la structure vient avant le style. Le design clarifie et guide ; il ne masque jamais un problème de fond.",
  },
  {
    number: "03",
    slug: "developpement",
    title: "Développement",
    tagline: "Transformer le concept en produit réel.",
    body: "Le design n'est pas une maquette qu'on remet à quelqu'un d'autre. On construit en code réel, avec une attention portée à la performance et à ce qui se passe une fois que les vrais utilisateurs arrivent.",
  },
  {
    number: "04",
    slug: "motion",
    title: "Motion",
    tagline: "Guider le regard et donner du rythme.",
    body: "Le mouvement a une fonction. Une transition guide, explique, révèle ou crée une émotion. Si elle n'apporte rien, elle disparaît.",
  },
  {
    number: "05",
    slug: "systemes",
    title: "Systèmes",
    tagline: "Construire pour évoluer.",
    body: "Un site ne doit pas devenir une contrainte quand l'entreprise grandit. On conçoit une architecture capable d'évoluer, d'accueillir du nouveau contenu et de rester maintenable dans le temps.",
  },
  {
    number: "06",
    slug: "integration",
    title: "Intégration",
    tagline: "Connecter votre site au reste de votre activité.",
    body: "Le site n'est pas une façade isolée. CRM, données, formulaires et automatisations doivent fonctionner ensemble pour former un véritable système numérique.",
  },
] as const;
