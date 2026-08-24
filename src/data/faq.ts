// Single source of truth for /faq's visible content AND its FAQPage JSON-LD.
// Every answer is grounded in real, already-established site content — no
// invented pricing, timelines, or claims.
export const FAQ = [
  {
    question: "Combien de temps prend un projet avec KOV ?",
    answer:
      "Ça dépend de la portée — un site vitrine et une plateforme avec espace client n'ont pas le même calendrier. Après un premier échange, on donne un calendrier clair avant de commencer, pas une estimation qui bouge en cours de route.",
  },
  {
    question: "Comment se déroule le processus ?",
    answer:
      "Sept étapes, toujours dans le même ordre : Découvrir, Structurer, Design, Développer, Motion, Lancer, Évoluer. Chaque étape est validée avant de passer à la suivante — pas de mauvaise surprise à la livraison.",
  },
  {
    question: "Quel budget prévoir ?",
    answer:
      "Ça dépend du projet — un site vitrine et une application avec espace client n'ont pas le même coût. Le plus simple est de nous exposer votre projet en contact, on revient avec une proposition claire.",
  },
  {
    question: "Que se passe-t-il après la mise en ligne ?",
    answer: "Un site n'est jamais terminé — il est maintenu intentionnellement.",
  },
  {
    question: "Utilisez-vous des templates ?",
    answer:
      "Non. Pas de templates, pas de banques d'images, pas de discours d'agence générique — chaque projet part de ce qui le rend différent.",
  },
  {
    question: "Proposez-vous un espace client pendant le projet ?",
    answer:
      "Oui — un espace client centralise le suivi de projet, les documents et les échanges pendant la production, pas seulement une fois le site livré.",
  },
  {
    question: "Comment choisissez-vous les technologies ?",
    answer:
      "On choisit la technologie en fonction du projet, pas l'inverse — l'objectif est un site rapide, maintenable, qui tient dans le temps.",
  },
] as const;
