import type { StarterPrompt } from "./starter";
import { CLARIFIER, INTERDITS } from "./starterFragments";

// Le pack « Construction et mise en ligne » : les étapes 11 à 20.
//
// La suite directe du pack maquette, et la numérotation continue d'une
// catégorie à l'autre pour que la séquence se lise de bout en bout. Une
// catégorie distincte parce que le métier change : les dix premières
// décident, celles-ci exécutent et vérifient.
//
// Le questionnement (CLARIFIER) n'est posé que sur les six étapes dont la
// sortie dépend d'un choix que les entrées ne donnent pas : composants,
// contenu, formulaires, lancement, mesure, reprise. Les quatre audits ont
// une méthode fixe et tout ce qu'il leur faut ; leur faire poser des
// questions apprendrait surtout à ignorer les questions.

export const BUILD_CATEGORY = {
  name: "Construction et mise en ligne",
  slug: "construction-mise-en-ligne",
  sortOrder: 6,
};

export const BUILD_PROMPTS: StarterPrompt[] = [
  {
    title: "11 · Traduction de la maquette en composants",
    description: "Découper la maquette en composants, en réutilisant ce qui existe déjà.",
    categorySlug: BUILD_CATEGORY.slug,
    type: "build",
    targetTool: "claude_code",
    tags: ["construction", "composants", "architecture"],
    variables: [
      { key: "plan_de_page", label: "Plan de page (étape 03)", type: "textarea", required: true },
      { key: "direction_artistique", label: "Direction artistique (étape 04)", type: "textarea" },
      { key: "stack", label: "Stack", type: "text", placeholder: "Next.js App Router, Tailwind, TypeScript" },
      { key: "existant", label: "Ce qui existe déjà", type: "textarea", placeholder: "Composants, tokens, conventions à réutiliser" },
    ],
    content: `# RÔLE
Développeur d'interface. Tu construis le moins de composants possible pour
tenir la maquette.

# OBJECTIF
Un découpage en composants, avec ce qui se réutilise et ce qui se crée.

# ENTRÉES
Plan de page :
{{plan_de_page}}

Direction artistique :
{{direction_artistique}}

Stack : {{stack}}
Existant :
{{existant}}

${CLARIFIER}

# MÉTHODE
1. Audite d'abord : liste ce qui existe et couvre déjà un besoin de la
   maquette. Ne recrée rien qui existe.
2. Découpe par responsabilité, pas par zone d'écran. Deux blocs qui se
   ressemblent mais changent pour des raisons différentes sont deux
   composants.
3. Garde le maximum côté serveur. Un composant ne passe côté client que
   s'il a un état, un écouteur ou une mesure à faire.
4. Décris pour chaque composant ses props, et ce qu'il ne fait pas.
5. Signale les pièges de mise en page : un élément collant se décolle dès
   qu'un ancêtre porte une transformation.

# FORMAT DE SORTIE
Tableau : composant, serveur ou client, props, réutilisé ou nouveau,
fichier proposé.
Puis l'ordre d'implémentation, et ce qui bloque quoi.

${INTERDITS}`,
  },
  {
    title: "12 · Intégration du contenu réel",
    description: "Remplacer les faux textes par la vraie matière, et nommer ce qui manque.",
    categorySlug: BUILD_CATEGORY.slug,
    type: "build",
    targetTool: "claude_code",
    tags: ["construction", "contenu", "integration"],
    variables: [
      { key: "sections", label: "Sections à remplir", type: "textarea", required: true },
      { key: "matiere", label: "Matière fournie", type: "textarea", required: true },
      {
        key: "source_contenu",
        label: "Où vivra le contenu",
        type: "select",
        options: ["Dans le code", "Base de données", "Administration à construire", "À décider"],
      },
    ],
    content: `# RÔLE
Intégrateur. Le texte de remplissage est une dette qui se paie le jour de
la mise en ligne.

# OBJECTIF
Mettre la vraie matière en place, et rendre visible tout ce qui manque.

# ENTRÉES
Sections :
{{sections}}

Matière fournie :
{{matiere}}

Destination du contenu : {{source_contenu}}

${CLARIFIER}

# MÉTHODE
1. Place la matière réelle section par section.
2. Là où elle manque, laisse un marqueur explicite « à fournir », jamais un
   texte plausible : un faux témoignage oublié devient un faux témoignage
   publié.
3. Vérifie le comportement aux extrêmes : un titre deux fois plus long, une
   liste vide, une image absente, un nom très court.
4. Si le contenu doit être modifiable sans redéploiement, dis-le et propose
   où il doit vivre.

# FORMAT DE SORTIE
- Section par section : placé, manquant, remarque.
- La liste de ce qui reste à fournir, prête à envoyer au client.
- Les cas limites traités, et ceux qui restent ouverts.

${INTERDITS}`,
  },
  {
    title: "13 · Formulaires et parcours de contact",
    description: "Le chemin qui transforme un visiteur en contact, y compris quand ça échoue.",
    categorySlug: BUILD_CATEGORY.slug,
    type: "build",
    targetTool: "claude_code",
    tags: ["construction", "formulaire", "conversion", "rgpd"],
    variables: [
      { key: "formulaire", label: "Quel formulaire", type: "text", placeholder: "Contact, devis, rappel", required: true },
      { key: "champs", label: "Champs souhaités", type: "textarea" },
      { key: "apres_envoi", label: "Ce qui doit se passer après", type: "textarea", placeholder: "Courriel, enregistrement, notification" },
      { key: "contraintes_rgpd", label: "Contraintes de données", type: "textarea" },
    ],
    content: `# RÔLE
Concepteur de parcours. Un formulaire est l'endroit où tout le travail
précédent se transforme en contact, ou se perd.

# OBJECTIF
Construire « {{formulaire}} » de bout en bout, échecs compris.

# ENTRÉES
Champs souhaités :
{{champs}}

Après envoi :
{{apres_envoi}}

Contraintes de données :
{{contraintes_rgpd}}

${CLARIFIER}

# MÉTHODE
1. Coupe les champs : chacun doit justifier le contact qu'il fait perdre.
   Un champ facultatif qui n'est jamais lu est un champ à supprimer.
2. Libellés visibles, jamais l'indication dans le champ comme seul libellé.
3. Valide au bon moment : à la sortie du champ, pas à chaque frappe, et
   l'erreur se lit à côté du champ concerné.
4. Traite les trois échecs : saisie invalide, envoi qui échoue, double
   soumission.
5. Dis ce qui se passe après l'envoi, à l'écran et dans la boîte mail.
6. Vérifie ce qui est stocké, où, et pourquoi. Aucune donnée sensible qui
   ne serve pas directement.

# FORMAT DE SORTIE
- Les champs retenus, et ceux écartés avec la raison.
- Les états : repos, saisie, erreur, envoi, succès, échec.
- Les messages, écrits.
- Ce qui est enregistré et ce qui est envoyé.

${INTERDITS}`,
  },
  {
    title: "14 · Performance et poids",
    description: "Ce qui est téléchargé, ce qui bloque l'affichage, ce qui décale la page.",
    categorySlug: BUILD_CATEGORY.slug,
    type: "audit",
    targetTool: "claude_code",
    tags: ["construction", "performance", "web-vitals"],
    variables: [
      { key: "pages", label: "Pages à mesurer", type: "textarea", required: true },
      { key: "budget", label: "Budget", type: "text", placeholder: "JS sous 200 ko, affichage principal sous 2,5 s" },
      { key: "appareil", label: "Appareil de référence", type: "select", options: ["Mobile", "Bureau", "Les deux"] },
    ],
    content: `# RÔLE
Relecteur de performance. Tu mesures ou tu dis que tu n'as pas mesuré.

# OBJECTIF
Savoir ce que coûte réellement chaque page, et ce qui se supprime sans rien
perdre.

# ENTRÉES
Pages :
{{pages}}

Budget : {{budget}}
Appareil : {{appareil}}

# MÉTHODE
1. Ce qui part au navigateur : quel JavaScript, et lequel pourrait rester
   côté serveur.
2. Images : format, dimensions réelles contre dimensions affichées, place
   réservée, chargement différé de ce qui n'est pas visible d'emblée.
3. Polices : préchargement, solution de repli, décalage à l'affichage.
4. Ce qui décale la mise en page pendant le chargement, section par section.
5. Scripts tiers : ce qu'ils coûtent, et ce qu'ils rapportent vraiment.
6. Ce qui est chargé sur téléphone alors que seul le bureau l'utilise.

# FORMAT DE SORTIE
Tableau : constat, page, coût estimé ou mesuré, correction, effort.
Une ligne finale séparant ce qui a été mesuré ici de ce qui reste à mesurer
dans un vrai navigateur.

${INTERDITS}`,
  },
  {
    title: "15 · Accessibilité",
    description: "Contraste, clavier, cibles, lecteurs d'écran, mouvement réduit.",
    categorySlug: BUILD_CATEGORY.slug,
    type: "audit",
    targetTool: "claude_code",
    tags: ["construction", "accessibilite", "audit"],
    variables: [
      { key: "pages", label: "Pages à vérifier", type: "textarea", required: true },
      { key: "niveau", label: "Niveau visé", type: "select", options: ["A", "AA", "AAA"] },
      { key: "points_connus", label: "Points déjà repérés", type: "textarea" },
    ],
    content: `# RÔLE
Relecteur d'accessibilité. Tu pars de ce qui empêche quelqu'un d'utiliser
le site, pas d'une liste à cocher.

# OBJECTIF
Rendre le site utilisable au clavier, à la voix, et avec peu de contraste
perçu. Niveau visé : {{niveau}}.

# ENTRÉES
Pages :
{{pages}}

Déjà repéré :
{{points_connus}}

# MÉTHODE
1. Parcours la page au clavier seul : ordre de tabulation, état de focus
   toujours visible, aucun piège, un lien d'évitement en tête.
2. Contrastes : texte courant, texte sur image, états au survol et au focus,
   et les bordures qui portent une information.
3. Cibles : 44 par 44 pixels au minimum, espacées d'au moins 8.
4. Structure : un seul h1, hiérarchie de titres sans saut, repères de page,
   listes qui sont de vraies listes.
5. Images : texte alternatif utile, ou vide quand l'image est décorative.
   Une description qui répète la légende n'aide personne.
6. Mouvement : tout ce qui bouge s'arrête sous mouvement réduit.
7. Formulaires : libellé lié à son champ, erreur annoncée, champ requis dit
   autrement que par la couleur.

# FORMAT DE SORTIE
Tableau : critère, constat, gravité, correction, fichier.
Classe par ce qui empêche l'usage avant ce qui le gêne.

${INTERDITS}`,
  },
  {
    title: "16 · Référencement à la mise en ligne",
    description: "Indexation, métadonnées, cartes de partage, redirections de l'ancien site.",
    categorySlug: BUILD_CATEGORY.slug,
    type: "audit",
    targetTool: "claude_code",
    tags: ["construction", "seo", "redirections"],
    variables: [
      { key: "domaine", label: "Domaine", type: "url", placeholder: "https://", required: true },
      { key: "pages", label: "Pages en ligne", type: "textarea" },
      { key: "requetes", label: "Requêtes visées", type: "textarea" },
      { key: "ancien_site", label: "Ancien site et ses URL", type: "textarea", placeholder: "Vide s'il n'y en a pas" },
    ],
    content: `# RÔLE
Relecteur de référencement technique. Tu vérifies ce qui empêche une page
d'exister dans un résultat de recherche.

# OBJECTIF
Que {{domaine}} soit indexable, correctement décrit, et qu'aucune adresse
existante ne se perde.

# ENTRÉES
Pages :
{{pages}}

Requêtes visées :
{{requetes}}

Ancien site :
{{ancien_site}}

# MÉTHODE
1. Indexation : robots, plan de site, canoniques, pages orphelines, liens
   morts. Vérifie qu'aucune page utile n'est bloquée par accident.
2. Métadonnées : titre et description uniques et utiles par page, longueur
   tenable, terme réellement recherché présent.
3. Un seul h1 par page, hiérarchie cohérente.
4. Carte de partage : une image au bon rapport pour chaque page, et vérifie
   qu'une image déclarée globalement n'écrase pas les cartes par page.
5. Données structurées : uniquement ce que la page affiche réellement.
6. Redirections : chaque adresse de l'ancien site tombe sur son équivalent,
   en permanent, sans chaîne de plus d'un saut.

# FORMAT DE SORTIE
- Tableau des problèmes : constat, gravité, page, correction.
- Tableau des redirections : ancienne adresse, nouvelle, code.
- Ce qui reste à vérifier une fois le domaine en ligne.

${INTERDITS}`,
  },
  {
    title: "17 · Recette avant lancement",
    description: "Le parcours complet, sur de vrais appareils, avant d'ouvrir les portes.",
    categorySlug: BUILD_CATEGORY.slug,
    type: "audit",
    targetTool: "claude_code",
    tags: ["construction", "recette", "qualite"],
    variables: [
      { key: "perimetre", label: "Périmètre", type: "textarea", required: true },
      { key: "navigateurs", label: "Navigateurs et appareils", type: "text", placeholder: "Safari iOS, Chrome Android, Firefox" },
      { key: "comptes_test", label: "Comptes et données de test", type: "textarea" },
    ],
    content: `# RÔLE
Responsable de recette. Tu cherches ce qui casse pour un visiteur réel, pas
ce qui casse pour un développeur.

# OBJECTIF
Un plan de recette exécutable, et son résultat.

# ENTRÉES
Périmètre :
{{perimetre}}

Navigateurs et appareils : {{navigateurs}}
Comptes de test :
{{comptes_test}}

# MÉTHODE
Construis le plan par parcours, pas par page : arriver, comprendre,
chercher, décider, contacter. Pour chacun, ce qu'on fait, ce qu'on attend,
et ce qui constitue un échec.

Ajoute les cas qu'on oublie toujours :
- Arrivée directe sur une page profonde, sans passer par l'accueil.
- Retour arrière du navigateur après une action.
- Rechargement en plein milieu d'un formulaire.
- Connexion lente, et image qui n'arrive pas.
- Téléphone tenu à l'horizontale.
- Deux envois rapprochés du même formulaire.

# FORMAT DE SORTIE
Tableau : parcours, étape, attendu, résultat, gravité.
Puis la liste des bloquants, qui sont les seuls à empêcher le lancement.

${INTERDITS}`,
  },
  {
    title: "18 · Préparation au lancement",
    description: "Domaine, redirections, sauvegarde, et l'ordre exact des opérations.",
    categorySlug: BUILD_CATEGORY.slug,
    type: "build",
    targetTool: "claude_code",
    tags: ["construction", "lancement", "mise-en-ligne"],
    variables: [
      { key: "domaine", label: "Domaine", type: "url", placeholder: "https://", required: true },
      { key: "hebergement", label: "Hébergement", type: "text" },
      {
        key: "ancien_site",
        label: "Ancien site",
        type: "select",
        options: ["Aucun", "Oui, à rediriger", "Oui, à conserver ailleurs"],
      },
      { key: "echeance", label: "Échéance", type: "text" },
    ],
    content: `# RÔLE
Responsable de mise en ligne. Tu écris la liste avant, pas pendant.

# OBJECTIF
Mettre {{domaine}} en ligne sans coupure et sans perte, avec un retour
arrière possible.

# ENTRÉES
Hébergement : {{hebergement}}
Ancien site : {{ancien_site}}
Échéance : {{echeance}}

${CLARIFIER}

# MÉTHODE
Produis la séquence exacte, dans l'ordre, avec pour chaque opération qui la
fait, combien de temps elle prend, et comment on l'annule.

Couvre au minimum :
1. Ce qui doit être vérifié avant de toucher au domaine.
2. La sauvegarde de l'existant, et où elle est vérifiée lisible.
3. Le changement de domaine et la propagation.
4. Les redirections, mises en place avant la bascule, pas après.
5. Le certificat, et le passage forcé en connexion sécurisée.
6. L'ouverture à l'indexation, qui vient après la vérification, jamais avant.
7. Les envois de courriel, testés avec une vraie adresse.
8. Le retour arrière : à quel moment il est encore possible, et comment.

# FORMAT DE SORTIE
Séquence numérotée, avec un point de non-retour clairement marqué.
Puis la liste de ce qu'on vérifie dans l'heure qui suit.

${INTERDITS}`,
  },
  {
    title: "19 · Mesure et premiers retours",
    description: "Ce qu'on regarde après le lancement, et ce qu'on décide de ne pas regarder.",
    categorySlug: BUILD_CATEGORY.slug,
    type: "build",
    targetTool: "generic",
    tags: ["construction", "mesure", "analytics"],
    variables: [
      { key: "objectif", label: "Objectif du site", type: "text", required: true },
      { key: "outils", label: "Outils en place", type: "text" },
      { key: "periode", label: "Période d'observation", type: "text", placeholder: "Les quatre premières semaines" },
    ],
    content: `# RÔLE
Analyste. Tu choisis peu d'indicateurs, et tu dis pourquoi les autres ne
servent pas.

# OBJECTIF
Savoir si le site tient sa promesse : {{objectif}}.

# ENTRÉES
Outils : {{outils}}
Période : {{periode}}

${CLARIFIER}

# MÉTHODE
1. Traduis l'objectif en un indicateur principal, un seul, qui monte quand
   le site marche.
2. Ajoute au plus trois indicateurs de soutien, chacun expliquant une
   variation possible du premier.
3. Nomme explicitement les chiffres qu'on décide d'ignorer, et pourquoi :
   un tableau de bord qui montre tout ne montre rien.
4. Dis ce qui est mesurable avec les outils en place, et ce qui demanderait
   un mouchard supplémentaire dont il faut peser le coût en vie privée.
5. Fixe le seuil à partir duquel on agit, avant de voir les données.

# FORMAT DE SORTIE
- Indicateur principal, sa définition exacte, où on le lit.
- Trois indicateurs de soutien.
- Ce qu'on ignore, et pourquoi.
- Le seuil de décision, écrit à l'avance.

${INTERDITS}
- Ne cite aucun chiffre de référence sectoriel : un taux « moyen » invoqué
  de mémoire est une donnée inventée.`,
  },
  {
    title: "20 · Reprise après lancement",
    description: "Trier les retours réels, et décider ce qu'on corrige maintenant.",
    categorySlug: BUILD_CATEGORY.slug,
    type: "transform",
    targetTool: "claude_code",
    tags: ["construction", "iteration", "retours"],
    variables: [
      { key: "retours", label: "Retours reçus", type: "textarea", required: true },
      { key: "mesures", label: "Ce que disent les mesures", type: "textarea" },
      { key: "contraintes", label: "Temps disponible", type: "text" },
    ],
    content: `# RÔLE
Responsable de produit. Tu tries, tu ne fais pas tout.

# OBJECTIF
Décider ce qui se corrige maintenant, ce qui attend, et ce qui ne se fera
pas.

# ENTRÉES
Retours :
{{retours}}

Mesures :
{{mesures}}

Temps disponible : {{contraintes}}

${CLARIFIER}

# MÉTHODE
1. Sépare ce qui empêche d'agir, ce qui gêne, et ce qui est une préférence.
   Un goût exprimé fort reste un goût.
2. Confronte chaque retour aux mesures : un ressenti que rien ne confirme
   se note, il ne se corrige pas immédiatement.
3. Cherche la cause derrière la demande. Quelqu'un qui demande un bouton
   plus gros décrit rarement le vrai problème.
4. Classe par gain sur l'objectif divisé par effort.
5. Assume une liste « ne sera pas fait », avec la raison. Sans elle, tout
   reste ouvert pour toujours.

# FORMAT DE SORTIE
Trois listes : maintenant, plus tard, jamais.
Chaque ligne : le retour, la cause supposée, la correction, l'effort.
Puis ce qu'il faudrait mesurer pour trancher les cas incertains.

${INTERDITS}`,
  },
];
