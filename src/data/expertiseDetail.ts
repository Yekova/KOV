import type { FaqCategory } from "./faq";
import { PILLARS } from "./expertisePillars";

// The long form of each expertise, for its own page.
//
// /expertise and its six pages were deleted and 301'd to an anchor on the
// homepage. That is a defensible call for a small site and a bad one for
// search: commercial intent — "création site internet Bordeaux", "refonte
// site vitrine" — is answered by a page about that job, not by a section of
// a page about everything. An anchor cannot rank, cannot carry its own
// title, and cannot answer a question.
//
// Everything here describes method and scope, which is what KOV can say
// about itself without qualification. There are no figures, no timelines,
// no prices and no claims about results: those live in a written proposal,
// which is the same line the FAQ already takes on every question of that
// shape.
//
// PILLARS stays the canonical list — slug, title, tagline and body come
// from there and are not repeated. This adds only what a page needs that a
// card does not.

export type PillarSlug = (typeof PILLARS)[number]["slug"];

export interface PillarDetail {
  slug: PillarSlug;
  /** ~55-60 characters: the display budget of a result in Google. */
  metaTitle: string;
  metaDescription: string;
  /** The page's own heading, which says the job rather than the discipline. */
  heading: string;
  lede: string;
  /** The body of the page. Prose, because a service page that is only
   *  bullet points reads as a brochure and answers nothing. */
  paragraphs: string[];
  /** What the work concretely includes. */
  covers: { title: string; body: string }[];
  /** Which FAQ categories belong under this page. The entries themselves
   *  stay in faq.ts — one source, so an answer corrected there is corrected
   *  on every page that shows it, and the page's FAQPage markup cannot
   *  drift from /faq's. */
  faqCategories: FaqCategory[];
}

export const PILLAR_DETAILS: PillarDetail[] = [
  {
    slug: "strategie",
    metaTitle: "Stratégie web : cadrer un projet avant de le dessiner | KOV",
    metaDescription:
      "Positionnement, architecture de l'information et parcours utilisateur : ce qui se décide avant la première maquette, et où se joue le résultat.",
    heading: "Cadrer un projet web avant de le dessiner",
    lede: "Positionnement, architecture de l'information, parcours. Les décisions qui coûtent cher à prendre tard.",
    paragraphs: [
      "La plupart des refontes ratées ne sont pas des problèmes de design. Ce sont des sites bien dessinés qui disent la mauvaise chose, à la mauvaise personne, dans le mauvais ordre. Une maquette ne rattrape jamais ça : elle le rend simplement plus présentable.",
      "On commence donc par décider ce que le site doit dire, à qui, et ce qu'on attend d'un visiteur à chaque étape. Cette phase produit des décisions écrites, pas des intentions : une arborescence, une hiérarchie de messages, un périmètre. C'est ce document qui permet ensuite de trancher vite quand une question de design se pose.",
      "C'est aussi la phase qui protège votre budget. Un arbitrage pris au cadrage se change en une conversation ; le même arbitrage pris pendant le développement se change en une reprise. Plus le projet avance, plus une décision coûte cher à défaire — ce n'est pas une règle de studio, c'est une propriété du travail.",
    ],
    covers: [
      {
        title: "Positionnement et message",
        body: "Ce que vous faites, pour qui, et ce qui vous distingue — formulé en phrases utilisables sur le site plutôt qu'en concepts.",
      },
      {
        title: "Architecture de l'information",
        body: "Quelles pages existent, ce que chacune doit faire, et comment elles s'enchaînent. L'arborescence avant les écrans.",
      },
      {
        title: "Parcours et conversion",
        body: "Le chemin qu'on veut faire prendre à un visiteur, et ce qu'on lui demande à la fin. Un site sans intention est une brochure.",
      },
      {
        title: "Cadrage du périmètre",
        body: "Ce qui est dans le projet et ce qui n'y est pas. Écrit, pour que la question ne se repose pas à mi-parcours.",
      },
    ],
    faqCategories: ["Le projet", "Budget & contrat"],
  },

  {
    slug: "design",
    metaTitle: "Design de site internet sur mesure à Bordeaux | KOV",
    metaDescription:
      "Direction artistique, design system et maquettes responsive. Des interfaces conçues comme de l'architecture : la structure d'abord, le style ensuite.",
    heading: "Design de site internet sur mesure",
    lede: "Une identité qu'on reconnaît, sur une structure qui tient. Dans cet ordre.",
    paragraphs: [
      "On conçoit une interface comme on conçoit un bâtiment : la structure vient avant le style. Une grille, une hiérarchie typographique et un système d'espacement décidés tôt font que chaque écran suivant se dessine plus vite et tient ensemble tout seul. Sans eux, chaque page devient une négociation.",
      "Le design n'est pas là pour masquer un problème de fond. Si un parcours n'est pas clair, un beau visuel le rend joli et confus. C'est pour ça que le cadrage précède la maquette : on dessine une décision déjà prise, pas l'inverse.",
      "Le résultat n'est pas une image mais un système : des composants nommés, des états définis, des règles qui se tiennent quand le contenu change. C'est ce qui permet à quelqu'un d'ajouter une page six mois plus tard sans que le site se désagrège.",
    ],
    covers: [
      {
        title: "Direction artistique",
        body: "Palette, typographie, traitement des images, ton. Un parti pris tenu sur l'ensemble, pas une page vitrine suivie de pages génériques.",
      },
      {
        title: "Design system",
        body: "Les composants, leurs états et leurs règles. Ce qui rend le dixième écran aussi rapide à produire que le troisième.",
      },
      {
        title: "Maquettes responsive",
        body: "Pensées à chaque largeur plutôt que réduites depuis l'écran large. La moitié de vos visiteurs arrivent sur un téléphone.",
      },
      {
        title: "Lisibilité et accessibilité",
        body: "Contrastes, tailles de texte, navigation au clavier, indication de focus. Ce sont des exigences de base, pas une option.",
      },
    ],
    faqCategories: ["Design & contenu", "Le projet"],
  },

  {
    slug: "developpement",
    metaTitle: "Développement web sur mesure — sites rapides | KOV Bordeaux",
    metaDescription:
      "Intégration en code réel, performance et SEO technique. Le design n'est pas une maquette qu'on transmet : on construit ce qu'on a dessiné.",
    heading: "Développement web sur mesure",
    lede: "Le design n'est pas une maquette qu'on remet à quelqu'un d'autre.",
    paragraphs: [
      "Un site se juge une fois que de vraies personnes arrivent dessus, sur de vrais appareils et de vraies connexions. Une maquette ne dit rien de ce moment-là. C'est pour ça qu'on construit ce qu'on dessine plutôt que de le transmettre : le compromis entre une intention visuelle et ce qu'un navigateur sait faire se décide bien mieux quand la même équipe tient les deux bouts.",
      "La performance n'est pas une passe d'optimisation en fin de projet, c'est une suite de décisions prises en chemin — le poids des images, ce qui se charge avant le reste, ce qui attend d'être visible. Rattrapée à la fin, elle coûte trois fois plus et rend la moitié du résultat.",
      "Le référencement technique relève du même chantier : une structure de titres cohérente, des URLs stables, des métadonnées justes, un plan de site qui se tient à jour tout seul. Ça ne remplace pas du contenu, mais ça décide si le contenu est lisible par une machine.",
    ],
    covers: [
      {
        title: "Intégration sur mesure",
        body: "Pas de thème détourné. Le code correspond au design parce qu'il a été écrit pour lui.",
      },
      {
        title: "Performance",
        body: "Images au bon format et au bon poids, chargement différé de ce qui n'est pas vu, rendu au plus près du serveur.",
      },
      {
        title: "SEO technique",
        body: "Balises, données structurées, plan de site, redirections. Les fondations sur lesquelles le contenu peut travailler.",
      },
      {
        title: "Administration du contenu",
        body: "Un espace où vous modifiez vos textes et vos images sans nous appeler, et sans pouvoir casser la mise en page.",
      },
    ],
    faqCategories: ["Technique", "Après la mise en ligne"],
  },

  {
    slug: "motion",
    metaTitle: "Motion design web : animations qui servent le propos | KOV",
    metaDescription:
      "Transitions, animations au défilement et micro-interactions. Le mouvement guide, explique ou révèle — sinon il disparaît.",
    heading: "Motion design pour le web",
    lede: "Le mouvement a une fonction, ou il n'a rien à faire là.",
    paragraphs: [
      "Une transition bien placée explique quelque chose qu'aucun texte n'aurait dit aussi vite : d'où vient cet élément, ce qui vient de changer, où regarder maintenant. Une transition mal placée fait attendre. La différence n'est pas une question de goût, c'est une question de fonction — et la première question qu'on pose à une animation est ce qu'elle apporte si on la retire.",
      "Le mouvement a aussi un coût. Une animation qui fait travailler le navigateur sur les mauvaises propriétés saccade sur la moitié des appareils, et l'appareil qui saccade est rarement celui du studio. On anime donc ce qui se compose sans repeindre la page, et on mesure plutôt qu'on suppose.",
      "Enfin, tout le monde ne veut pas de mouvement, et certains ne le supportent pas. Le système d'exploitation permet de le dire ; le site doit l'écouter. Chaque animation a une version immobile qui reste compréhensible.",
    ],
    covers: [
      {
        title: "Transitions et enchaînements",
        body: "Ce qui relie deux états ou deux pages, pour que le passage se comprenne au lieu de se subir.",
      },
      {
        title: "Animations au défilement",
        body: "Révéler au rythme de la lecture, pas faire un spectacle pendant qu'on essaie de lire.",
      },
      {
        title: "Micro-interactions",
        body: "Un bouton qui répond, un champ qui confirme. Les petits retours qui font qu'une interface semble vivante.",
      },
      {
        title: "Mouvement réduit",
        body: "Respect de la préférence système, avec un rendu immobile qui dit la même chose.",
      },
    ],
    faqCategories: ["Design & contenu", "Technique"],
  },

  {
    slug: "systemes",
    metaTitle: "Sites évolutifs et maintenables dans le temps | KOV",
    metaDescription:
      "Un site ne doit pas devenir une contrainte quand l'entreprise grandit. Architecture évolutive, contenu administrable et code qui se reprend.",
    heading: "Construire un site qui peut évoluer",
    lede: "Un site ne doit pas devenir une contrainte quand l'entreprise grandit.",
    paragraphs: [
      "La plupart des sites ne meurent pas d'un défaut de départ : ils meurent d'avoir rendu chaque ajout un peu plus coûteux que le précédent. Au bout de deux ans, ajouter une page demande un développeur, et la refonte redevient plus simple que l'évolution. C'est une issue qu'on peut décider d'éviter dès la conception.",
      "Ça se joue sur trois choses : une architecture qui prévoit de la croissance plutôt que de la supposer stable, un contenu que vous administrez sans nous, et un code qu'un autre développeur peut reprendre. La troisième est celle qu'on oublie, et c'est celle qui vous rend libre.",
      "Un site conçu ainsi ne demande pas d'être refait quand votre activité change de forme. Il demande d'être étendu — ce qui est une conversation beaucoup plus courte.",
    ],
    covers: [
      {
        title: "Architecture évolutive",
        body: "Des fondations prévues pour accueillir des pages, des langues ou des sections qui n'existent pas encore.",
      },
      {
        title: "Contenu administrable",
        body: "Vos textes, vos images et vos projets modifiables depuis une interface, sans intervention ni déploiement.",
      },
      {
        title: "Code repris sans nous",
        body: "Des conventions lisibles et des décisions expliquées dans le code. Votre site ne doit pas être otage d'un prestataire.",
      },
      {
        title: "Suivi après la mise en ligne",
        body: "Ce qui se passe une fois le site en ligne se décide avant, pas au moment où une question se pose.",
      },
    ],
    faqCategories: ["Après la mise en ligne", "Budget & contrat"],
  },

  {
    slug: "integration",
    metaTitle: "Connecter son site à ses outils : CRM, données | KOV",
    metaDescription:
      "Le site n'est pas une façade isolée. Formulaires, CRM, automatisations et espace client connectés pour former un vrai système.",
    heading: "Connecter votre site au reste de votre activité",
    lede: "Un site isolé du reste de vos outils vous fait ressaisir ce qu'il a déjà collecté.",
    paragraphs: [
      "Un formulaire qui envoie un e-mail que quelqu'un recopie ensuite dans un tableur n'est pas une automatisation : c'est une saisie déplacée. Le site sait déjà qui a écrit, quand et à quel sujet — l'enjeu est que cette information arrive là où votre travail se fait réellement.",
      "Ce raccordement va dans les deux sens. Le site peut nourrir vos outils, et vos outils peuvent nourrir le site : un espace où vos clients retrouvent leurs documents, un suivi qu'ils consultent sans vous écrire, des contenus qui se mettent à jour sans déploiement.",
      "Chaque connexion ajoute une chose qui peut tomber en panne, donc on n'en branche aucune sans raison. La bonne question n'est pas ce qu'il est possible de connecter, mais quelle ressaisie vous faites toutes les semaines.",
    ],
    covers: [
      {
        title: "Formulaires et CRM",
        body: "Les demandes arrivent qualifiées et rangées, pas dans une boîte mail où elles se perdent.",
      },
      {
        title: "Automatisations",
        body: "Les relances, confirmations et notifications qui ne devraient pas dépendre de quelqu'un qui y pense.",
      },
      {
        title: "Espace client",
        body: "Un accès privé où vos clients retrouvent leurs documents et le suivi de leur projet.",
      },
      {
        title: "Données et suivi",
        body: "Savoir ce qui se passe sur le site, avec des chiffres réels plutôt qu'une impression.",
      },
    ],
    faqCategories: ["Technique", "Après la mise en ligne"],
  },
];

/** The pillar and its long form, together. Fails loudly rather than
 *  rendering half a page if the two lists ever drift. */
export function getPillar(slug: string) {
  const pillar = PILLARS.find((entry) => entry.slug === slug);
  const detail = PILLAR_DETAILS.find((entry) => entry.slug === slug);
  return pillar && detail ? { pillar, detail } : null;
}
