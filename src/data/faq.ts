// Single source of truth for /faq's visible content AND its FAQPage
// JSON-LD. Every answer is grounded in real, already-established site
// content and policy — no invented pricing, timelines, guarantees, or
// team-size claims. Where a real client would reasonably ask for a hard
// number (deposit %, warranty duration, response time), the answer says
// where that gets defined (the written proposal/contract) rather than
// inventing one — same principle applied throughout this site.
//
// First draft of 50 — content to be reviewed/corrected before treating it
// as final; the surrounding engine (search, category filters, grouping)
// is built to handle edits/additions/removals here without further change.

export const FAQ_CATEGORIES = [
  "Le projet",
  "Budget & contrat",
  "Design & contenu",
  "Technique",
  "Après la mise en ligne",
  "Le studio",
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export interface FaqItem {
  category: FaqCategory;
  question: string;
  answer: string;
}

export const FAQ: FaqItem[] = [
  // Le projet
  {
    category: "Le projet",
    question: "Combien de temps prend un projet avec KOV ?",
    answer:
      "Ça dépend de la portée — un site vitrine et une plateforme avec espace client n'ont pas le même calendrier. Après un premier échange, on donne un calendrier clair avant de commencer, pas une estimation qui bouge en cours de route.",
  },
  {
    category: "Le projet",
    question: "Comment se déroule le processus ?",
    answer:
      "Sept étapes, toujours dans le même ordre : Découvrir, Structurer, Design, Développer, Motion, Lancer, Évoluer. Chaque étape est validée avant de passer à la suivante — pas de mauvaise surprise à la livraison.",
  },
  {
    category: "Le projet",
    question: "Par quoi commence-t-on exactement ?",
    answer:
      "Par l'étape « Découvrir » : un échange pour comprendre votre activité, vos utilisateurs et ce que le site doit accomplir — avant de parler design ou technique.",
  },
  {
    category: "Le projet",
    question: "Qui est mon interlocuteur pendant le projet ?",
    answer:
      "Un interlocuteur unique suit votre projet du premier échange à la mise en ligne — pas un standard qui change à chaque étape.",
  },
  {
    category: "Le projet",
    question: "Comment communique-t-on pendant le projet ?",
    answer:
      "Par l'espace client pour le suivi, les documents et les échanges structurés, et par email ou appel pour les points qui le demandent — pas quinze outils différents à surveiller.",
  },
  {
    category: "Le projet",
    question: "Combien d'allers-retours ou de révisions sont prévus ?",
    answer:
      "Chaque étape (design, développement, etc.) inclut une phase de retours avant validation. L'objectif est de converger ensemble à chaque étape, pas de recommencer indéfiniment après qu'elle a été validée.",
  },
  {
    category: "Le projet",
    question: "Que se passe-t-il si mes besoins changent en cours de route ?",
    answer:
      "On ajuste le calendrier et la proposition en conséquence. Un changement de périmètre est discuté et chiffré avant d'être intégré, pas glissé silencieusement dans le projet initial.",
  },
  {
    category: "Le projet",
    question: "Puis-je voir le site avant qu'il soit terminé ?",
    answer:
      "Oui — l'espace client donne accès aux livrables au fur et à mesure (maquettes, environnement de développement), pas seulement le jour de la mise en ligne.",
  },
  {
    category: "Le projet",
    question: "Travaillez-vous avec des clients qui ne sont pas à Bordeaux ?",
    answer:
      "Oui — le studio est basé à Bordeaux mais la majorité des échanges se font à distance. La localisation ne change rien à la manière dont un projet est mené.",
  },

  // Budget & contrat
  {
    category: "Budget & contrat",
    question: "Quel budget prévoir ?",
    answer:
      "Ça dépend du projet — un site vitrine et une application avec espace client n'ont pas le même coût. Le plus simple est de nous exposer votre projet en contact, on revient avec une proposition claire.",
  },
  {
    category: "Budget & contrat",
    question: "Comment se passe le paiement ?",
    answer:
      "Un acompte au démarrage, puis des paiements liés aux grandes étapes du projet plutôt qu'un règlement unique à la fin. Le détail exact est précisé dans la proposition, avant signature.",
  },
  {
    category: "Budget & contrat",
    question: "Y a-t-il un contrat ?",
    answer:
      "Oui — chaque projet est encadré par un accord écrit distinct des conditions d'utilisation de ce site, qui précise le périmètre, le calendrier et les livrables.",
  },
  {
    category: "Budget & contrat",
    question: "Que se passe-t-il si je veux arrêter le projet en cours de route ?",
    answer:
      "Les conditions d'arrêt (ce qui a été livré, ce qui reste dû) sont précisées dans l'accord signé avant de démarrer, pas improvisées après coup.",
  },
  {
    category: "Budget & contrat",
    question: "Le prix inclut-il l'hébergement et le nom de domaine ?",
    answer: "Ça dépend de la formule retenue — c'est clarifié dans la proposition, pas une surprise sur la première facture.",
  },
  {
    category: "Budget & contrat",
    question: "Proposez-vous un paiement mensuel plutôt qu'un projet ponctuel ?",
    answer:
      "Oui, sur certains projets — notamment quand la maintenance ou l'évolution du site est incluse dans la durée plutôt que facturée au coup par coup.",
  },
  {
    category: "Budget & contrat",
    question: "Facturez-vous les petites modifications après la mise en ligne ?",
    answer:
      "Une période de garantie couvre les ajustements liés à la livraison. Au-delà, les demandes suivent le même principe que le reste du projet : clarifié avant d'être fait, jamais facturé en silence.",
  },
  {
    category: "Budget & contrat",
    question: "Le budget peut-il évoluer en cours de projet ?",
    answer: "Seulement si le périmètre évolue. Un budget fixé au départ reste fixé, sauf changement de périmètre discuté et validé ensemble.",
  },
  {
    category: "Budget & contrat",
    question: "Le premier échange et le devis sont-ils gratuits ?",
    answer: "Oui — ils servent à savoir si le projet a du sens avant de s'engager, pas à vous facturer une étude préalable.",
  },

  // Design & contenu
  {
    category: "Design & contenu",
    question: "Utilisez-vous des templates ?",
    answer:
      "Non. Pas de templates, pas de banques d'images, pas de discours d'agence générique — chaque projet part de ce qui le rend différent.",
  },
  {
    category: "Design & contenu",
    question: "Qui rédige le contenu du site (textes, images) ?",
    answer:
      "Ça se construit ensemble. Vous connaissez votre activité, on structure et on met en forme ; on peut aussi accompagner la rédaction si besoin, mais on n'invente jamais un contenu générique à votre place.",
  },
  {
    category: "Design & contenu",
    question: "Je n'ai pas encore d'identité de marque (logo, couleurs) — est-ce un problème ?",
    answer:
      "Non — si une direction visuelle n'existe pas encore, on la construit comme partie du projet. Si elle existe déjà, on s'appuie dessus plutôt que de la réinventer.",
  },
  {
    category: "Design & contenu",
    question: "Combien de propositions de design vais-je voir ?",
    answer:
      "Une direction de départ, affinée avec vos retours jusqu'à validation — pas une multitude d'options qui dilue la réflexion, ni une seule proposition à prendre ou laisser.",
  },
  {
    category: "Design & contenu",
    question: "Le site sera-t-il accessible (contraste, navigation clavier, lecteurs d'écran) ?",
    answer:
      "L'accessibilité fait partie de la construction, pas une case cochée après coup — contraste, navigation clavier et structure sémantique sont pensés dès le design.",
  },
  {
    category: "Design & contenu",
    question: "Puis-je modifier le contenu moi-même après la mise en ligne ?",
    answer:
      "Oui, quand le projet inclut un espace d'administration adapté à votre contenu — construit pour ce que vous avez réellement besoin de modifier, pas un CMS générique surdimensionné.",
  },
  {
    category: "Design & contenu",
    question: "Le site fonctionnera-t-il bien sur mobile ?",
    answer: "Oui — chaque site est pensé et testé sur mobile, tablette et desktop dès la conception, pas adapté après coup en dernière minute.",
  },
  {
    category: "Design & contenu",
    question: "Utilisez-vous des animations sur tous les projets ?",
    answer:
      "Non — le mouvement a une fonction. Certains projets en ont besoin pour guider ou marquer, d'autres non. On ne l'ajoute jamais juste pour faire de l'effet.",
  },
  {
    category: "Design & contenu",
    question: "Puis-je fournir mes propres visuels et photos ?",
    answer:
      "Oui, avec plaisir — de vrais visuels valent toujours mieux qu'une banque d'images générique, c'est d'ailleurs ce qu'on privilégie par défaut.",
  },

  // Technique
  {
    category: "Technique",
    question: "Comment choisissez-vous les technologies ?",
    answer: "On choisit la technologie en fonction du projet, pas l'inverse — l'objectif est un site rapide, maintenable, qui tient dans le temps.",
  },
  {
    category: "Technique",
    question: "Le site sera-t-il rapide ?",
    answer:
      "La performance fait partie du cahier des charges dès le départ, pas un correctif ajouté après coup — un site lent perd des visiteurs avant même qu'ils voient le contenu.",
  },
  {
    category: "Technique",
    question: "Le code m'appartient-il ?",
    answer:
      "Oui — une fois le projet livré et réglé, le code et les assets vous appartiennent. Vous n'êtes jamais enfermé chez KOV pour faire évoluer votre propre site.",
  },
  {
    category: "Technique",
    question: "Où le site est-il hébergé ?",
    answer:
      "On recommande une infrastructure moderne adaptée au projet, mais vous n'êtes jamais obligé d'en dépendre — l'hébergement peut être transféré si besoin.",
  },
  {
    category: "Technique",
    question: "Le site est-il sécurisé ?",
    answer:
      "Oui — authentification, protection des formulaires et des données suivent les pratiques standard du secteur ; rien n'est laissé par défaut sans y avoir réfléchi.",
  },
  {
    category: "Technique",
    question: "Construisez-vous des applications, pas seulement des sites vitrines ?",
    answer: "Oui — applications web, espaces clients, dashboards et systèmes internes font partie du travail au même titre qu'un site public.",
  },
  {
    category: "Technique",
    question: "Pouvez-vous intégrer mes outils existants (CRM, facturation, paiement) ?",
    answer:
      "Oui — un site qui reste isolé de vos autres outils devient vite une contrainte. On construit les connexions nécessaires plutôt que des exports manuels.",
  },
  {
    category: "Technique",
    question: "Que se passe-t-il si mon site tombe en panne ?",
    answer:
      "Le périmètre du support (délai d'intervention, ce qui est couvert) est précisé dans la proposition — pas une question qu'on découvre le jour où ça arrive.",
  },
  {
    category: "Technique",
    question: "Reprenez-vous un site existant pour le faire évoluer ?",
    answer:
      "Ça dépend de l'état du code existant. Après un audit rapide, on vous dit honnêtement s'il vaut mieux faire évoluer l'existant ou repartir sur des bases saines.",
  },

  // Après la mise en ligne
  {
    category: "Après la mise en ligne",
    question: "Que se passe-t-il après la mise en ligne ?",
    answer:
      "Un site n'est jamais terminé — il est maintenu intentionnellement. C'est la dernière étape du processus (« Évoluer »), pas une case qu'on coche à la livraison.",
  },
  {
    category: "Après la mise en ligne",
    question: "Proposez-vous un espace client pendant le projet ?",
    answer:
      "Oui — un espace client centralise le suivi de projet, les documents et les échanges pendant la production, et reste utile une fois le site livré pour le support et les évolutions.",
  },
  {
    category: "Après la mise en ligne",
    question: "Le site est-il maintenu automatiquement ?",
    answer:
      "Non — la maintenance (mises à jour, surveillance, évolutions) est une étape du processus, pas un abonnement imposé. Le niveau de suivi souhaité se discute avec vous.",
  },
  {
    category: "Après la mise en ligne",
    question: "Puis-je faire évoluer le site plus tard (nouvelles pages, nouvelles fonctionnalités) ?",
    answer: "Oui, c'est même l'idée — l'architecture est pensée pour accueillir du nouveau contenu et de nouvelles fonctionnalités sans tout reconstruire.",
  },
  {
    category: "Après la mise en ligne",
    question: "Que se passe-t-il si je veux changer de prestataire après la livraison ?",
    answer:
      "Le code vous appartenant, un autre prestataire peut reprendre le projet — on documente ce qui est nécessaire pour que la transition ne soit pas un saut dans le vide.",
  },
  {
    category: "Après la mise en ligne",
    question: "Les sauvegardes sont-elles automatiques ?",
    answer:
      "Oui, pour les projets avec base de données ou espace client — la fréquence et la durée de rétention sont précisées selon le projet.",
  },
  {
    category: "Après la mise en ligne",
    question: "Comment suis-je informé si quelque chose ne fonctionne pas ?",
    answer:
      "Selon le niveau de suivi convenu, par surveillance automatisée et/ou par un contact direct — pas en attendant que vous le remarquiez en premier.",
  },
  {
    category: "Après la mise en ligne",
    question: "Fournissez-vous des statistiques de fréquentation après la mise en ligne ?",
    answer:
      "Oui, si le projet le prévoit — sans traceurs superflus ni collecte au-delà de ce qui est nécessaire, dans le même esprit que notre propre politique de confidentialité.",
  },

  // Le studio
  {
    category: "Le studio",
    question: "Qui se cache derrière KOV ?",
    answer:
      "Un studio digital basé à Bordeaux, concentré sur la stratégie, le design, le développement et les systèmes interactifs — voir la page Studio pour la philosophie complète.",
  },
  {
    category: "Le studio",
    question: "Travaillez-vous seul ou en équipe ?",
    answer:
      "Selon le projet, en petite équipe resserrée — l'objectif est un interlocuteur clair et une responsabilité directe, pas une chaîne de sous-traitance qui dilue les deux.",
  },
  {
    category: "Le studio",
    question: "Sur quel type de clients ou de secteurs travaillez-vous ?",
    answer: "KOV n'est pas spécialisé sur un secteur unique — le point commun des projets, c'est une exigence sur le résultat, pas l'industrie.",
  },
  {
    category: "Le studio",
    question: "Puis-je voir d'autres projets réalisés ?",
    answer:
      "Oui — les projets disponibles sont visibles sur la page d'accueil et la page Studio ; certains sont encore en préparation et rejoindront le portfolio au fur et à mesure.",
  },
  {
    category: "Le studio",
    question: "Pourquoi choisir KOV plutôt qu'un constructeur de site (Wix, Shopify...) ?",
    answer:
      "Un constructeur de site convient pour démarrer vite avec peu de moyens. KOV construit un système sur mesure quand la marque, la performance ou les fonctionnalités dépassent ce qu'un modèle générique permet.",
  },
  {
    category: "Le studio",
    question: "Comment démarrer un projet avec KOV ?",
    answer: "Un message via le formulaire de contact, avec quelques mots sur votre projet — on revient vers vous pour planifier le premier échange.",
  },
];
