import type { StarterPrompt } from "./starter";

// Le pack « Maquette site web » : les dix premières étapes de construction,
// dans l'ordre.
//
// Il est tiré de la façon dont ce site a réellement été construit, et il
// porte les règles qui sont revenues à chaque demande : le mobile se
// simplifie au lieu de rétrécir, un appel à l'action est atteignable dès
// l'arrivée, l'animation lourde reste au bureau, et rien ne s'invente.
//
// Deux partis pris de conception de prompt, valables pour les dix :
//
// 1. Ils s'enchaînent. La sortie de l'étape N est une variable de l'étape
//    N+1. C'est ce qui empêche le modèle de repartir de zéro à chaque fois
//    et de contredire à l'étape 6 ce qu'il a décidé à l'étape 1.
// 2. Ils ont tous le même squelette : RÔLE, OBJECTIF, ENTRÉES, MÉTHODE,
//    FORMAT DE SORTIE, INTERDITS. Un squelette commun se compose avec les
//    blocs du Builder et se relit sans réapprendre la mise en page.
//
// Le numéro est dans le titre, à dessein : la bibliothèque trie par ordre
// alphabétique quand on le lui demande, et c'est le seul moyen de rendre la
// séquence visible partout, y compris dans la palette de commandes. Le
// numéro dit ici quelque chose de vrai, c'est une suite, pas une décoration.

export const MOCKUP_CATEGORY = { name: "Maquette site web", slug: "maquette-site-web", sortOrder: 5 };

/** Repris à l'identique dans les dix, en dernière section. C'est la règle
 *  permanente du studio, et un prompt qui ne la porte pas produit tôt ou
 *  tard un chiffre que personne ne peut sourcer. */
const INTERDITS = `# INTERDITS
- Ne rien inventer : chiffre, note, avis, témoignage, prix, délai, référence
  client, qualification, adresse, ni donnée structurée.
- Ce qui manque est listé comme « à fournir », jamais comblé par une
  vraisemblance.
- Aucune promesse que le studio n'a pas confirmée.`;

export const MOCKUP_PROMPTS: StarterPrompt[] = [
  {
    title: "01 · Cadrage et objectif de conversion",
    description: "La promesse, l'action principale et l'inventaire des preuves réellement disponibles.",
    categorySlug: MOCKUP_CATEGORY.slug,
    type: "build",
    targetTool: "generic",
    tags: ["maquette", "cadrage", "conversion"],
    variables: [
      { key: "client_name", label: "Client", type: "text", required: true },
      { key: "secteur", label: "Secteur", type: "text", placeholder: "Gestion de patrimoine", required: true },
      { key: "cible", label: "À qui on parle", type: "textarea", required: true },
      { key: "objectif", label: "Objectif de la page", type: "textarea", placeholder: "Obtenir une prise de contact qualifiée", required: true },
      { key: "preuves", label: "Preuves disponibles", type: "textarea", placeholder: "Projets livrés, certifications, chiffres vérifiables…" },
      { key: "contraintes", label: "Contraintes", type: "textarea" },
    ],
    content: `# RÔLE
Directeur de création et stratège de conversion. Tu cadres avant de dessiner.

# OBJECTIF
Poser ce qu'un site de {{client_name}} doit obtenir, de qui, et avec quelles
preuves. Aucune maquette ne commence avant que ce document existe.

# ENTRÉES
Secteur : {{secteur}}
Cible : {{cible}}
Objectif : {{objectif}}
Preuves disponibles : {{preuves}}
Contraintes : {{contraintes}}

# MÉTHODE
1. Reformule la cible en une personne, pas un segment : ce qu'elle cherche,
   dans quel état d'esprit, et ce qui la ferait partir.
2. Écris la promesse en une phrase, compréhensible sans le secteur.
3. Liste les trois objections qui empêchent cette personne d'agir, classées
   par ce qui bloque le plus.
4. Désigne une action principale unique, et au plus une action secondaire.
5. Fais l'inventaire des preuves réellement disponibles, et sépare
   explicitement ce qui existe de ce qui reste à obtenir.

# FORMAT DE SORTIE
- Promesse : une phrase.
- Personne : un paragraphe.
- Trois objections, chacune avec la preuve qui y répond, ou « à fournir ».
- Action principale, action secondaire.
- Tableau : preuve, source, vérifiable oui/non.

${INTERDITS}`,
  },
  {
    title: "02 · Architecture de l'information",
    description: "L'arborescence, une intention par page, et ce qui ne mérite pas d'exister.",
    categorySlug: MOCKUP_CATEGORY.slug,
    type: "build",
    targetTool: "generic",
    tags: ["maquette", "arborescence", "seo"],
    variables: [
      { key: "cadrage", label: "Cadrage (sortie de l'étape 01)", type: "textarea", required: true },
      { key: "pages_imposees", label: "Pages imposées", type: "textarea", placeholder: "Mentions légales, CGV, pages métier existantes…" },
      { key: "requetes", label: "Requêtes visées", type: "textarea", placeholder: "Une par ligne" },
    ],
    content: `# RÔLE
Architecte de l'information. Tu réponds à « combien de pages, et pourquoi
celles-là ».

# OBJECTIF
Une arborescence où chaque page a une intention unique et une raison d'être
trouvée.

# ENTRÉES
Cadrage :
{{cadrage}}

Pages imposées : {{pages_imposees}}
Requêtes visées :
{{requetes}}

# MÉTHODE
1. Une page = une intention de recherche + une décision à faire avancer. Si
   deux pages partagent l'intention, elles se fusionnent.
2. Rattache chaque requête visée à une page, et une seule. Une requête sans
   page est un manque ; deux pages pour une requête est une concurrence
   interne.
3. Propose le maillage : depuis quelle page on atteint quelle autre, et avec
   quelle ancre.
4. Liste ce qui ne mérite pas une page et doit rester une section.

# FORMAT DE SORTIE
- Arborescence en liste indentée, avec l'URL proposée.
- Tableau : page, intention, requête principale, décision qu'elle fait
  avancer.
- Maillage : origine, destination, ancre.
- Section « Retiré, et pourquoi ».

${INTERDITS}`,
  },
  {
    title: "03 · Plan de la page d'accueil",
    description: "La séquence des sections, chacune justifiée par la décision qu'elle fait avancer.",
    categorySlug: MOCKUP_CATEGORY.slug,
    type: "build",
    targetTool: "generic",
    tags: ["maquette", "homepage", "ux"],
    variables: [
      { key: "cadrage", label: "Cadrage (étape 01)", type: "textarea", required: true },
      { key: "arborescence", label: "Arborescence (étape 02)", type: "textarea" },
      { key: "action_principale", label: "Action principale", type: "text", required: true },
    ],
    content: `# RÔLE
Concepteur d'expérience. Tu construis un parcours de lecture, pas une liste
de blocs à la mode.

# OBJECTIF
La séquence des sections de la page d'accueil, chacune tenue de justifier sa
présence.

# ENTRÉES
Cadrage :
{{cadrage}}

Arborescence :
{{arborescence}}

Action principale : {{action_principale}}

# MÉTHODE
1. Ordonne les sections selon la progression d'un visiteur : ce qu'il doit
   comprendre, croire, puis décider.
2. Pour chaque section, écris la question du visiteur à laquelle elle
   répond. Une section sans question est retirée.
3. Vérifie que l'action principale est atteignable dès l'arrivée, sans
   défiler, et qu'elle revient au moins une fois plus bas.
4. Signale toute section dont le contenu réel n'existe pas encore : elle
   reste au plan, marquée « contenu à fournir », jamais remplie d'exemple.

# FORMAT DE SORTIE
Tableau, dans l'ordre d'apparition :
section, question du visiteur, contenu nécessaire, disponible oui/non,
décision qu'elle fait avancer.
Puis une ligne de conclusion : ce que la page demande au visiteur, en une
phrase.

${INTERDITS}`,
  },
  {
    title: "04 · Direction artistique et tokens",
    description: "Palette, typographie, densité et rayons, écrits comme des variables réutilisables.",
    categorySlug: MOCKUP_CATEGORY.slug,
    type: "build",
    targetTool: "generic",
    tags: ["maquette", "direction-artistique", "tokens"],
    variables: [
      { key: "client_name", label: "Client", type: "text", required: true },
      { key: "secteur", label: "Secteur", type: "text" },
      { key: "emotions", label: "Ce que ça doit faire ressentir", type: "textarea", placeholder: "Trois adjectifs, pas plus", required: true },
      { key: "references", label: "Références visuelles", type: "textarea" },
      { key: "contraintes_marque", label: "Contraintes de marque", type: "textarea", placeholder: "Logo, couleurs imposées, typographie sous licence…" },
    ],
    content: `# RÔLE
Directeur artistique. Tu décides, tu ne proposes pas trois pistes tièdes.

# OBJECTIF
Une direction artistique écrite sous forme de tokens, directement
réutilisable en CSS.

# ENTRÉES
Client : {{client_name}}
Secteur : {{secteur}}
Intention : {{emotions}}
Références : {{references}}
Contraintes de marque : {{contraintes_marque}}

# MÉTHODE
1. Choisis une couleur de fond, une couleur de texte, deux neutres et un
   seul accent. L'accent est réservé aux actions : s'il sert aussi de
   décoration, il ne signale plus rien.
2. Choisis deux familles typographiques avec des rôles distincts, et une
   troisième seulement si des chiffres ou du code doivent s'aligner.
3. Pose une échelle de taille, un interligne pour le corps, une longueur de
   ligne cible, et tiens-t'en à cette échelle.
4. Décide la densité, les rayons, le traitement des images et des bordures.
5. Termine par ce que cette direction s'interdit.

# FORMAT DE SORTIE
Un bloc de tokens CSS commenté, puis une justification d'une ligne par
choix, rattachée à l'intention.

# INTERDITS SUPPLÉMENTAIRES
- Pas de palette générique : évite crème et terracotta, le noir avec un seul
  vert acide, le dégradé violet vers bleu, et les fontes choisies par
  défaut.
- Aucun emoji en guise d'icône.
- Pas d'accent qui se bat avec le fond : s'il crie, désature plutôt que de
  le remplacer.

${INTERDITS}`,
  },
  {
    title: "05 · Wireframe basse fidélité",
    description: "La structure avant le style, en schéma texte, mobile et bureau côte à côte.",
    categorySlug: MOCKUP_CATEGORY.slug,
    type: "build",
    targetTool: "generic",
    tags: ["maquette", "wireframe", "structure"],
    variables: [
      { key: "plan_de_page", label: "Plan de page (étape 03)", type: "textarea", required: true },
      { key: "largeurs", label: "Largeurs cibles", type: "text", placeholder: "375 et 1440" },
    ],
    content: `# RÔLE
Concepteur de structure. À cette étape, la couleur et la typographie
n'existent pas encore.

# OBJECTIF
Un wireframe lisible en texte, qui montre la hiérarchie et rien d'autre.

# ENTRÉES
Plan de page :
{{plan_de_page}}

Largeurs cibles : {{largeurs}}

# MÉTHODE
1. Dessine chaque section en schéma ASCII, d'abord en largeur téléphone,
   puis en largeur bureau.
2. Note à côté de chaque bloc son niveau de hiérarchie : 1 pour ce qui se
   lit en premier, 2 pour le soutien, 3 pour le détail.
3. Marque les zones tactiles et vérifie qu'aucune n'est sous 44 par 44
   pixels ni collée à une autre.
4. Indique où se termine le premier écran sur téléphone, et ce qui doit être
   visible avant cette limite.

# FORMAT DE SORTIE
Pour chaque section : deux schémas ASCII côte à côte, la liste des blocs
avec leur niveau, et une phrase sur ce que l'œil attrape en premier.

${INTERDITS}`,
  },
  {
    title: "06 · Hero, version mobile d'abord",
    description: "Le bloc qui décide : promesse, preuve immédiate et action atteignable sans défiler.",
    categorySlug: MOCKUP_CATEGORY.slug,
    type: "build",
    targetTool: "generic",
    tags: ["maquette", "hero", "conversion", "mobile"],
    variables: [
      { key: "cadrage", label: "Cadrage (étape 01)", type: "textarea", required: true },
      { key: "direction_artistique", label: "Direction artistique (étape 04)", type: "textarea" },
      { key: "action_principale", label: "Action principale", type: "text", required: true },
      { key: "preuve_immediate", label: "Preuve disponible tout de suite", type: "textarea" },
    ],
    content: `# RÔLE
Concepteur et rédacteur. Le hero est la seule section que tout le monde
voit : il se traite en premier et se juge sur téléphone.

# OBJECTIF
Un hero qui dit ce que c'est, pour qui, et ce qu'on peut faire, sans faire
défiler.

# ENTRÉES
Cadrage :
{{cadrage}}

Direction artistique :
{{direction_artistique}}

Action principale : {{action_principale}}
Preuve immédiate : {{preuve_immediate}}

# MÉTHODE
1. Écris la version téléphone en premier, et conçois la version bureau comme
   un élargissement de celle-ci. Le mobile n'est pas la version bureau
   rétrécie : on simplifie pour être plus impactant, on ne réduit pas.
2. Propose trois titres de registres différents, et dis lequel tu retiens et
   pourquoi.
3. Le bouton principal dit ce qui va se passer, pas « En savoir plus ».
4. Nomme ce qui est retiré sur téléphone, et pourquoi son absence ne coûte
   rien.
5. Vérifie que le titre, la ligne de soutien et le bouton tiennent dans le
   premier écran d'un téléphone courant.

# FORMAT DE SORTIE
- Trois titres, avec le retenu justifié en une ligne.
- Ligne de soutien, une phrase.
- Libellé du bouton principal, et du secondaire s'il existe.
- Deux colonnes : gardé sur téléphone, retiré sur téléphone.
- Ce qui reste à fournir pour que le hero soit vrai.

${INTERDITS}`,
  },
  {
    title: "07 · Rédaction d'une section",
    description: "Titre, corps, micro-copie et états vides, pour une section du plan.",
    categorySlug: MOCKUP_CATEGORY.slug,
    type: "build",
    targetTool: "generic",
    tags: ["maquette", "contenu", "redaction"],
    variables: [
      { key: "section_cible", label: "Section à écrire", type: "text", required: true },
      { key: "plan_de_page", label: "Plan de page (étape 03)", type: "textarea", required: true },
      { key: "contenu_disponible", label: "Matière disponible", type: "textarea", placeholder: "Ce qui existe vraiment : projets, textes, visuels" },
      { key: "ton", label: "Ton", type: "text", placeholder: "Direct, sobre, sans superlatif" },
    ],
    content: `# RÔLE
Rédacteur d'interface. Les mots sont de la matière de conception, pas de la
décoration posée à la fin.

# OBJECTIF
Écrire la section « {{section_cible}} » avec tout ce qu'elle contient,
y compris ce que personne ne pense à écrire.

# ENTRÉES
Plan de page :
{{plan_de_page}}

Matière disponible :
{{contenu_disponible}}

Ton : {{ton}}

# MÉTHODE
1. Écris du côté du lecteur : nomme les choses comme il les reconnaît, pas
   comme le système les appelle.
2. Produis le titre, le corps, et la micro-copie de chaque commande. Une
   commande dit exactement ce qui arrive.
3. Écris aussi l'état vide, l'état de chargement et le message d'erreur
   quand la section en a : un message d'erreur explique ce qui s'est passé
   et comment s'en sortir.
4. Sépare en fin de réponse ce qui vient de la matière fournie de ce qui
   reste à obtenir.

# FORMAT DE SORTIE
Titre, corps, commandes, états, puis « À fournir ».
Longueurs indiquées en nombre de signes pour chaque bloc.

${INTERDITS}`,
  },
  {
    title: "08 · Passage responsive",
    description: "Simplifier pour être plus impactant, rupture par rupture, au lieu de rétrécir.",
    categorySlug: MOCKUP_CATEGORY.slug,
    type: "transform",
    targetTool: "claude_code",
    tags: ["maquette", "responsive", "mobile"],
    variables: [
      { key: "cible_responsive", label: "Page ou section", type: "text", required: true },
      { key: "points_de_rupture", label: "Points de rupture", type: "text", placeholder: "640 / 768 / 1024 / 1280" },
      { key: "problemes", label: "Ce qui casse aujourd'hui", type: "textarea" },
    ],
    content: `# RÔLE
Concepteur responsive. Tu pars du téléphone, pas de l'écran large réduit.

# OBJECTIF
Rendre {{cible_responsive}} lisible et efficace sur téléphone, sans en faire
une version appauvrie.

# ENTRÉES
Points de rupture : {{points_de_rupture}}
Ce qui casse :
{{problemes}}

# RÈGLE DU PROJET
Simplifier le responsive pour être le plus impactant. Le but est d'amener
un contact : ce qui ne sert pas cette décision sort de l'écran téléphone.

# MÉTHODE
1. Pour chaque rupture, dis ce qui reste, ce qui est retiré, ce qui est
   réordonné, et pourquoi.
2. Vérifie qu'une action principale est atteignable sans défilement, et
   qu'elle fait toute la largeur si c'est ce qui la rend plus facile à
   viser.
3. Contrôle les fondamentaux : aucune largeur fixe en pixels sur un
   conteneur, aucun défilement horizontal, aucun texte de corps sous 12
   pixels, zones tactiles d'au moins 44 par 44 pixels espacées de 8.
4. Cherche les espacements verticaux hérités du bureau : c'est presque
   toujours là que naît l'impression de page interminable sur téléphone.
5. Mesure ce que la version téléphone fait défiler en hauteur avant
   d'atteindre la première action.

# FORMAT DE SORTIE
Tableau par rupture : gardé, retiré, réordonné, raison.
Puis la liste des corrections, chacune rattachée à un fichier et une ligne.

${INTERDITS}`,
  },
  {
    title: "09 · Chorégraphie au scroll",
    description: "Le mouvement qui accompagne la lecture, au bureau seulement, avec son repli.",
    categorySlug: MOCKUP_CATEGORY.slug,
    type: "build",
    targetTool: "claude_code",
    tags: ["maquette", "motion", "gsap"],
    variables: [
      { key: "sections", label: "Sections concernées", type: "textarea", required: true },
      { key: "intensite", label: "Intensité", type: "select", options: ["Discrète", "Standard", "Appuyée"] },
      { key: "contraintes_perf", label: "Contraintes de performance", type: "text" },
    ],
    content: `# RÔLE
Concepteur de mouvement. L'animation sert la lecture ou elle disparaît.

# OBJECTIF
Une chorégraphie au défilement qui donne du relief sans coûter la
performance ni l'accessibilité.

# ENTRÉES
Sections :
{{sections}}

Intensité : {{intensite}}
Contraintes : {{contraintes_perf}}

# RÈGLES NON NÉGOCIABLES
1. Au bureau seulement, au-delà de 1024 pixels. Une tablette tenue à une
   main n'est pas un ordinateur.
2. prefers-reduced-motion coupe tout.
3. L'état de départ n'existe que dans le code exécuté, jamais dans le HTML
   envoyé : un contenu invisible sans JavaScript est un contenu invisible
   quand JavaScript échoue.
4. Une transformation par élément. Deux effets qui écrivent la même
   propriété sur le même nœud, et le dernier gagne en silence.
5. Attention aux éléments collants : une transformation sur un ancêtre les
   décolle sans erreur.

# MÉTHODE
Distingue le mouvement à l'arrivée, qui se déclenche une fois au seuil, du
mouvement pendant le défilement, qui suit la progression. Le second est ce
qui fait qu'une page répond au lieu d'apparaître ; réserve-le aux sections
qui en ont besoin.

# FORMAT DE SORTIE
Tableau : section, effet, déclencheur, amplitude, durée, repli.
Puis ce qui reste à juger dans un navigateur, en nommant les valeurs à
ajuster.

${INTERDITS}`,
  },
  {
    title: "10 · Revue avant passage en code",
    description: "Six axes de contrôle sur la maquette, avant d'engager du développement.",
    categorySlug: MOCKUP_CATEGORY.slug,
    type: "audit",
    targetTool: "claude_code",
    tags: ["maquette", "audit", "accessibilite"],
    variables: [
      { key: "maquette", label: "Maquette ou pages à revoir", type: "textarea", required: true },
      { key: "objectif", label: "Objectif rappelé", type: "text", required: true },
      { key: "points_de_vigilance", label: "Points de vigilance", type: "textarea" },
    ],
    content: `# RÔLE
Relecteur critique. Tu cherches ce qui coûtera cher plus tard, pas ce qui se
corrige en une minute.

# OBJECTIF
Décider si cette maquette peut partir en développement.

# ENTRÉES
Maquette :
{{maquette}}

Objectif : {{objectif}}
Vigilance : {{points_de_vigilance}}

# SIX AXES
1. Décision. Un visiteur arrivant à froid sait-il quoi faire, et comment ?
2. Hiérarchie. Ce qui compte se lit-il en premier, à chaque largeur ?
3. Accessibilité. Contraste du texte, état de focus visible, taille et
   espacement des cibles, navigation au clavier, textes alternatifs.
4. Performance. Poids des médias, place réservée pour éviter les décalages,
   ce qui peut attendre d'être visible.
5. Référencement de base. Un seul h1 par page, hiérarchie de titres
   cohérente, titre et description utiles, carte de partage au bon format.
6. Honnêteté. Chaque chiffre, avis, référence ou donnée structurée est-il
   rattachable à une source réelle ?

# MÉTHODE
Un constat par ligne, rattaché à un axe et à un endroit précis. Classe par
ce qui coûtera le plus cher à corriger après le développement, pas par ce
qui saute aux yeux.

# FORMAT DE SORTIE
Tableau : axe, constat, gravité, correction proposée, où.
Puis une conclusion en une ligne : prêt, prêt sous réserve, ou à reprendre,
avec la raison.

${INTERDITS}`,
  },
];
