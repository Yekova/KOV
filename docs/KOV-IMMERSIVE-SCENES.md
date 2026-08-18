# KOV — Immersive Scenes

## Principe fondamental

Le site n'est **pas** : `Hero → section → cartes → section → footer`.

Il fonctionne comme :

```
ARRIVÉE → APPROCHE → ENTRÉE → EXPLORATION → TRANSFORMATION → PROJETS → SORTIE
```

Le **scroll est la navigation principale**. Chaque scroll peut provoquer une transformation physique : travelling caméra, zoom, rotation subtile, entrée dans un écran, traversée d'une matière, ouverture d'un espace, séparation de layers, apparition du personnage, recomposition d'une interface, changement d'échelle.

**La transformation est la signature KOV.**

## Deux mondes séparés

### Monde 3D
Environnement, architecture, profondeur, personnages, objets, matières, transitions, ambiance. Rendu en séquences frame-by-frame, vidéos scrubbed, Canvas, ou WebGL ponctuellement.

### Monde HTML
H1/H2, textes, CTA, navigation, labels, informations projet, formulaire, liens.

**Règle absolue** : ne jamais cuire les textes importants dans les images ou vidéos 3D. Ça préserve SEO, responsive, accessibilité et netteté typographique.

## Le Hero

Scène d'ouverture extrêmement simple : architecture brutaliste + grand ordinateur + écran totalement noir. **Aucun texte dans l'écran.**

Au-dessus, en HTML :

```
KOV

WE BUILD
WHAT PEOPLE
REMEMBER.

Design / Development / Motion

SCROLL TO ENTER
```

## Première transformation

```
ordinateur éloigné
  ↓ approche caméra
ordinateur plus grand
  ↓
écran noir presque plein cadre
  ↓
bordures de l'écran hors viewport
  ↓
blackout très court
  ↓
entrée dans l'écran
  ↓
architecture digitale intérieure
```

C'est le premier moment wow du site.

## Système scene / frame / canvas

```
scroll → progress → scene → frame → canvas
```

Chaque grande scène a sa propre séquence :

```
/scenes
  HeroScene
  EnterScene
  ExpertiseScene
  WorkScene
  ProcessScene
  ContactScene
```

## Keyframes — workflow

Ne pas générer 200 images avant de verrouiller les scènes. Verrouiller d'abord les keyframes clés, puis seulement générer les frames intermédiaires :

```
KEYFRAME 01 — point de départ
KEYFRAME 02 — première approche
KEYFRAME 03 — écran proche
KEYFRAME 04 — écran plein cadre
KEYFRAME 05 — traversée
KEYFRAME 06 — nouvel environnement
```

## UX du scroll

Chaque scène a un début et une fin précis, définis dans une donnée centrale plutôt que codés en dur dans chaque composant (voir `src/data/scenes.ts`) :

```ts
{ id: "hero", scrollStart: 0, scrollEnd: 0.14 }
{ id: "enter-screen", scrollStart: 0.14, scrollEnd: 0.25 }
```

## Portfolio

Un projet n'est jamais une carte dans une grille `3 cards × 2 rows`. Chaque projet devient une expérience / un environnement : scène, grande image, floating panel Liquid Glass, quelques informations, CTA.

```
PROJECT / 01

KANTI
WEALTH MANAGEMENT

STRATEGY
DESIGN
DEVELOPMENT

VIEW CASE →
```

## Responsive

Mobile n'est **pas** desktop réduit à 375px. Sur mobile : moins de frames, scènes raccourcies, moins de mouvements latéraux, zooms plus centraux, moins de glass, UI plus traditionnelle quand nécessaire. L'immersion reste, mais la performance passe avant tout.

## Accessibilité

Prévoir dès le départ `@media (prefers-reduced-motion: reduce)` :
- remplacer les longues séquences par quelques keyframes
- supprimer les déplacements importants
- conserver tous les textes et contenus

## Images et vidéos générées

Règle absolue pour tout asset généré : ne **jamais** inclure titres, paragraphes, boutons, logos, menu, faux texte. Les images représentent uniquement : monde / objets / personnage / architecture. Les vraies interfaces restent dans le code.

## Sound

Jamais de son activé automatiquement. Prévoir un bouton `SOUND OFF` optionnel pour une ambiance discrète plus tard. Le son reste toujours optionnel.
