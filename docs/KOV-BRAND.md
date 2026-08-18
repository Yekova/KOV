# KOV — Brand

## ADN de marque

**BRUTAL. PRECISE. IMMERSIVE. INTENTIONAL.**

Formule directrice :

> KOV transforms ideas into digital experiences.

Discours de marque :

> WE BUILD WHAT PEOPLE REMEMBER.

Le site ne doit jamais donner l'impression d'être "un beau site d'agence". Il doit donner l'impression que l'utilisateur entre dans un univers conçu par KOV.

## Palette

```css
:root {
  --kov-black: #080808;
  --kov-carbon: #111111;
  --kov-graphite: #1B1B1B;

  --kov-red: #D92525;
  --kov-red-signal: #F03732;

  --kov-bone: #F1EFEA;
  --kov-white: #FFFFFF;

  --kov-concrete: #C6C4BF;
  --kov-steel: #777774;
  --kov-muted: #484846;

  --kov-border: #272727;
}
```

Répartition : **75% noir / 17% blanc-gris / 8% rouge**.

Le rouge n'est jamais décoratif. Il signifie toujours : action / progression / focus / interaction / direction.

### Usage du noir

Le noir est l'espace principal de KOV — il représente silence / architecture / profondeur / contrôle.

Éviter un simple fond `#000`. Utiliser plusieurs profondeurs pour éviter l'impression de site plat :

- `#080808` — espace
- `#111111` — surface
- `#1B1B1B` — profondeur
- `#272727` — séparation

## Logo

Le logo principal est le wordmark **KOV**, très horizontal et étiré, géométrique, presque industriel. C'est la signature principale.

Déclinaisons :
- Secondaire : `KOV.`
- Signature : `KOV /`
- Monogramme : `K`

Couleurs autorisées : blanc sur noir, rouge sur noir, noir sur blanc cassé.

**Interdit** : effets 3D, chrome, gradient sur le logo.

### Assets

| Fichier | Usage |
|---|---|
| `/kov/brand/kov-wordmark-bone-on-black.png` | Wordmark principal, blanc sur noir |
| `/kov/brand/kov-wordmark-black-on-bone.png` | Wordmark, noir sur blanc cassé |
| `/kov/brand/kov-signature-red-dot.png` | Signature `KOV.` avec le point rouge |
| `/kov/brand/kov-monogram-k.png` | Monogramme `K`, favicon / espaces réduits |

## Typographie

Deux familles maximum.

**Display** (gros titres) : condensée / massive / architecturale / verticale — `Archivo Narrow`.

**UI / Body** (neutre) : `Geist`.

### Hiérarchie

```css
--display-xl: clamp(72px, 9vw, 160px);
--display-lg: clamp(56px, 7vw, 120px);
--heading-lg: clamp(38px, 5vw, 72px);
```

Line-height très faible (`.85`), tracking légèrement négatif. Les titres peuvent être gigantesques :

```
WE BUILD
WHAT PEOPLE
REMEMBER.
```

Le point final rouge devient un motif de marque récurrent.

## Grille

Grille desktop 12 colonnes. Des lignes architecturales très fines peuvent occasionnellement devenir visibles (évoquent Figma / plan architectural / ingénierie) :

```css
border-color: rgba(241, 239, 234, 0.12);
```

Pas de grille constamment visible — elle doit apparaître comme un langage graphique, pas un fond permanent.

## Le rouge comme fil conducteur

Une ligne rouge KOV revient dans tout le site. Elle peut devenir : barre de progression, ligne dans l'architecture, pointeur, axe d'un schéma, lumière, séparateur, curseur.

C'est un motif de marque extrêmement simple et réutilisable — à ne pas dupliquer sous d'autres formes.

## Voix / CTA

Les CTA participent au ton éditorial, jamais génériques :

- `VIEW PROJECT →`
- `START A PROJECT →`

Jamais "En savoir plus" ou équivalent générique.

Navigation, très petite, avec repère de scène courante :

```
KOV              WORK   EXPERTISE   STUDIO   CONTACT      ●
```

```
02 / EXPERTISE
```

Voir [KOV-DO-DONT.md](./KOV-DO-DONT.md) pour la liste complète de ce que KOV ne doit jamais devenir.
