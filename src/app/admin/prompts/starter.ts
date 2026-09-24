import type { PromptType, TargetTool, VariableType } from "./schema";

// La bibliothèque de départ, posée par installStarterLibrary().
//
// Ce ne sont pas des exemples : ce sont des gabarits écrits pour cette base
// de code — Next.js App Router, Supabase, Tailwind v4, GSAP, React Three
// Fiber — avec les variables qu'ils demandent réellement. Ils sont faits
// pour être modifiés et versionnés dès la première utilisation.
//
// Aucun chiffre, aucun délai, aucun tarif n'y figure : un gabarit qui
// contiendrait « livré en 3 semaines » mettrait une promesse inventée dans
// la bouche de qui s'en sert.

export interface StarterVariable {
  key: string;
  label: string;
  type: VariableType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export interface StarterPrompt {
  title: string;
  description: string;
  categorySlug: string;
  type: PromptType;
  targetTool: TargetTool;
  tags: string[];
  content: string;
  variables: StarterVariable[];
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    title: "Créer une homepage premium",
    description: "Structure complète d'une page d'accueil haut de gamme, de la DA aux sections.",
    categorySlug: "ui-design",
    type: "build",
    targetTool: "claude_code",
    tags: ["nextjs", "homepage", "design"],
    variables: [
      { key: "client_name", label: "Client", type: "text", placeholder: "Nom du client", required: true },
      { key: "industry", label: "Secteur", type: "text", placeholder: "Gestion de patrimoine", required: true },
      { key: "art_direction", label: "Direction artistique", type: "textarea", required: true },
      { key: "stack", label: "Stack", type: "text", placeholder: "Next.js App Router, Tailwind v4, GSAP" },
      { key: "sections", label: "Sections attendues", type: "textarea" },
      { key: "constraints", label: "Contraintes", type: "textarea" },
    ],
    content: `# OBJECTIF
Construire la page d'accueil de {{client_name}}, dans le secteur {{industry}}.

# DIRECTION ARTISTIQUE
{{art_direction}}

# STACK
{{stack}}

# STRUCTURE
{{sections}}

# CONTRAINTES
{{constraints}}

# RÈGLES
- Aucun chiffre, avis, témoignage ou référence client qui ne me soit confirmé.
- Mobile d'abord : la version téléphone doit être simplifiée pour être plus
  impactante, pas être la version bureau rétrécie.
- Un appel à l'action visible sans défilement à l'arrivée.
- Les animations respectent prefers-reduced-motion.

# LIVRABLE
Liste des fichiers créés et modifiés, puis vérification par tsc, lint et build.`,
  },
  {
    title: "Audit SEO technique",
    description: "Passe complète sur l'indexation, les métadonnées, les données structurées et le maillage.",
    categorySlug: "seo",
    type: "audit",
    targetTool: "claude_code",
    tags: ["seo", "audit", "nextjs"],
    variables: [
      { key: "site_url", label: "URL du site", type: "url", placeholder: "https://", required: true },
      { key: "target_keywords", label: "Requêtes visées", type: "textarea", required: true },
      { key: "scope", label: "Périmètre", type: "select", options: ["Tout le site", "Une section", "Une page"] },
    ],
    content: `# OBJECTIF
Auditer le référencement technique de {{site_url}} sur le périmètre : {{scope}}.

# REQUÊTES VISÉES
{{target_keywords}}

# À VÉRIFIER
- title et meta description de chaque page : longueur, unicité, présence du terme.
- Un seul h1 par page, hiérarchie h2/h3 cohérente.
- Données structurées : validité, cohérence avec ce qui est affiché.
- Canoniques, sitemap, robots, pages orphelines, liens morts.
- Open Graph : une carte au bon format par page.
- Cœur des Web Vitals : ce qui est mesurable sans navigateur.

# RÈGLES
- Ne jamais inventer une donnée structurée qui ne correspond pas à une
  information réellement publiée sur la page.
- Chaque recommandation est rattachée à un fichier et une ligne.

# LIVRABLE
Un tableau : problème, gravité, fichier, correction proposée.`,
  },
  {
    title: "Refondre une navbar existante",
    description: "Retravaille une navigation en conservant la direction artistique et la structure.",
    categorySlug: "ui-design",
    type: "transform",
    targetTool: "claude_code",
    tags: ["ui", "navigation", "responsive"],
    variables: [
      { key: "file_path", label: "Fichier", type: "text", placeholder: "src/components/layout/Nav.tsx", required: true },
      { key: "current_issues", label: "Ce qui ne va pas", type: "textarea", required: true },
      { key: "breakpoints", label: "Points de rupture", type: "text", placeholder: "640 / 768 / 1024" },
    ],
    content: `# OBJECTIF
Refondre la navigation de {{file_path}} sans changer la direction artistique.

# CE QUI NE VA PAS
{{current_issues}}

# POINTS DE RUPTURE
{{breakpoints}}

# CONTRAINTES
- Conserver la DA, la typographie et les tokens existants.
- Ne pas casser les routes ni les ancres en place.
- Navigation au clavier et focus visible.
- Zones tactiles d'au moins 44 × 44 px.

# LIVRABLE
Le diff, puis ce qui reste à vérifier dans un navigateur.`,
  },
  {
    title: "Créer une expérience 360 interactive",
    description: "Scène WebGL navigable dans le navigateur, avec budget de performance explicite.",
    categorySlug: "webgl-3d",
    type: "build",
    targetTool: "claude_code",
    tags: ["webgl", "threejs", "r3f"],
    variables: [
      { key: "theme", label: "Sujet de la scène", type: "textarea", required: true },
      { key: "interactions", label: "Interactions attendues", type: "textarea" },
      { key: "performance_budget", label: "Budget de performance", type: "text", placeholder: "60 fps sur portable milieu de gamme" },
    ],
    content: `# OBJECTIF
Construire une scène 3D temps réel navigable dans le navigateur.

# SUJET
{{theme}}

# INTERACTIONS
{{interactions}}

# BUDGET
{{performance_budget}}

# CONTRAINTES
- React Three Fiber, chargement différé de la scène.
- Une solution de repli pour les appareils sans WebGL et pour
  prefers-reduced-motion.
- Le verrouillage du pointeur est une API de bureau : prévoir des commandes
  tactiles ou désactiver proprement sur mobile.
- Textures et modèles compressés, décomptés dans le budget.

# LIVRABLE
Les fichiers, le coût en poids téléchargé, et ce qui reste à mesurer dans un
navigateur réel.`,
  },
  {
    title: "Créer un espace client Supabase",
    description: "Schéma, RLS, routes et formulaires d'un portail client complet.",
    categorySlug: "supabase",
    type: "build",
    targetTool: "claude_code",
    tags: ["supabase", "rls", "admin"],
    variables: [
      { key: "entities", label: "Entités", type: "textarea", placeholder: "projets, documents, factures…", required: true },
      { key: "roles", label: "Rôles", type: "text", placeholder: "client, admin" },
      { key: "rls_rules", label: "Règles d'accès", type: "textarea", required: true },
    ],
    content: `# OBJECTIF
Construire un espace client.

# ENTITÉS
{{entities}}

# RÔLES
{{roles}}

# RÈGLES D'ACCÈS
{{rls_rules}}

# CONTRAINTES
- Une vraie migration SQL, jamais de modification manuelle de la base.
- RLS activé sur chaque table : ne jamais le désactiver pour simplifier.
- Les écritures d'administration passent par le rôle service, derrière un
  contrôle de rôle applicatif.
- Les erreurs attendues sont renvoyées, pas levées.

# LIVRABLE
Migration, policies, routes, composants, puis la liste de ce qui reste à
tester connecté.`,
  },
  {
    title: "Audit de performance",
    description: "Poids, chemin critique, images, polices, et ce qui décale la mise en page.",
    categorySlug: "performance",
    type: "audit",
    targetTool: "claude_code",
    tags: ["performance", "audit", "web-vitals"],
    variables: [
      { key: "page_url", label: "Page", type: "url", placeholder: "https://", required: true },
      { key: "device", label: "Appareil", type: "select", options: ["Mobile", "Bureau", "Les deux"] },
      { key: "budget", label: "Budget", type: "text", placeholder: "JS < 200 ko, LCP < 2,5 s" },
    ],
    content: `# OBJECTIF
Auditer les performances de {{page_url}} sur {{device}}.

# BUDGET
{{budget}}

# À VÉRIFIER
- Poids du JavaScript expédié, et ce qui pourrait rester côté serveur.
- Images : format, dimensions réservées, chargement différé.
- Polices : préchargement, solution de repli, décalage à l'affichage.
- Ce qui décale la mise en page pendant le chargement.
- Scripts tiers et leur coût réel.

# RÈGLES
- Aucune mesure inventée : ce qui n'a pas été mesuré ici est signalé comme
  restant à mesurer.

# LIVRABLE
Tableau : constat, coût estimé, correction, effort.`,
  },
  {
    title: "Image hero",
    description: "Gabarit de génération d'image pour une section d'en-tête.",
    categorySlug: "image-generation",
    type: "build",
    targetTool: "image_generation",
    tags: ["image", "hero", "direction-artistique"],
    variables: [
      { key: "subject", label: "Sujet", type: "textarea", required: true },
      { key: "mood", label: "Ambiance", type: "text", placeholder: "nocturne, minérale, contrastée" },
      { key: "palette", label: "Palette", type: "text", placeholder: "graphite, os, rouge signal" },
      { key: "format", label: "Format", type: "select", options: ["16:9", "21:9", "4:5", "1:1"] },
    ],
    content: `{{subject}}

Ambiance : {{mood}}.
Palette : {{palette}}.
Cadrage : {{format}}, composition laissant une zone calme pour du texte.
Lumière naturelle, matières réelles, aucun texte incrusté, aucun logo.`,
  },
  {
    title: "Diagnostiquer une régression",
    description: "Méthode d'instrumentation avant théorie, pour un bug qui ne se reproduit pas à la demande.",
    categorySlug: "debug",
    type: "audit",
    targetTool: "claude_code",
    tags: ["debug", "react", "instrumentation"],
    variables: [
      { key: "symptom", label: "Symptôme", type: "textarea", required: true },
      { key: "file_path", label: "Zone suspectée", type: "text" },
      { key: "recent_changes", label: "Changements récents", type: "textarea" },
    ],
    content: `# SYMPTÔME
{{symptom}}

# ZONE SUSPECTÉE
{{file_path}}

# CHANGEMENTS RÉCENTS
{{recent_changes}}

# MÉTHODE
1. Instrumenter avant de théoriser : poser des traces qui survivent au
   plantage plutôt que d'enchaîner les hypothèses.
2. Reproduire, ou expliquer précisément pourquoi ce n'est pas possible ici.
3. Ne proposer une correction qu'une fois la cause établie.
4. Retirer une affirmation dès qu'une mesure la contredit.

# LIVRABLE
La cause, la correction, et ce qui reste invérifiable sans navigateur.`,
  },
];

export interface StarterBlock {
  name: string;
  description: string;
  content: string;
  category: string;
}

/** La matière du Prompt Builder : des fragments qu'on empile pour composer
 *  un prompt neuf. Ce sont les contraintes qui reviennent dans presque
 *  toutes les demandes, écrites une fois. */
export const STARTER_BLOCKS: StarterBlock[] = [
  {
    name: "Audit préalable",
    description: "Exiger un état des lieux avant toute écriture de code.",
    category: "Méthode",
    content: `# AVANT DE CODER
Auditer l'existant : stack, structure, composants, tokens, conventions.
Ne pas recréer ce qui existe déjà. Réutiliser composants, hooks et helpers.`,
  },
  {
    name: "Préserver la direction artistique",
    description: "Interdire la dérive visuelle pendant une refonte.",
    category: "Design",
    content: `# DIRECTION ARTISTIQUE
Conserver la DA existante : palette, typographie, densité, rayons, tokens.
Aucune bibliothèque de composants tierce. Pas d'esthétique SaaS générique.`,
  },
  {
    name: "Responsive",
    description: "La règle mobile du projet, en trois lignes.",
    category: "Design",
    content: `# RESPONSIVE
Simplifier le mobile pour le rendre plus impactant, pas le rétrécir.
Zones tactiles d'au moins 44 × 44 px, espacées d'au moins 8 px.
Aucun défilement horizontal, aucun texte sous 12 px.`,
  },
  {
    name: "Performance",
    description: "Budget et réflexes de performance.",
    category: "Technique",
    content: `# PERFORMANCE
Réserver la place des médias. Différer ce qui n'est pas visible d'emblée.
Garder le maximum côté serveur. Pas de bibliothèque ajoutée sans justification.`,
  },
  {
    name: "Honnêteté des données",
    description: "La règle permanente : rien d'inventé.",
    category: "Méthode",
    content: `# DONNÉES
Ne jamais inventer : chiffre, avis, note, témoignage, prix, délai, adresse,
téléphone, qualification, référence client ou donnée structurée.
Ce qui n'est pas connu est signalé comme à fournir.`,
  },
  {
    name: "Supabase et RLS",
    description: "Les règles de base pour toute écriture en base.",
    category: "Technique",
    content: `# BASE DE DONNÉES
Toute évolution de schéma passe par une migration versionnée.
RLS activé sur chaque table, jamais désactivé pour simplifier.
Les écritures d'administration passent par le rôle service, derrière un
contrôle de rôle applicatif.`,
  },
  {
    name: "Livrables et vérification",
    description: "Ce qu'on attend en fin de tâche.",
    category: "Méthode",
    content: `# LIVRABLE
Liste des fichiers créés et modifiés.
Vérification par tsc, lint et build.
Ce qui n'a pas pu être vérifié ici est dit explicitement.`,
  },
];
