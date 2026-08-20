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
  --kov-black: #0A0A0A;
  --kov-carbon: #111315;
  --kov-graphite: #181D20;

  --kov-red: #E31E24;
  --kov-red-signal: #FF4D4D;

  --kov-bone: #E7E7E5;
  --kov-white: #FFFFFF;

  --kov-concrete: #C6C4BF;
  --kov-steel: #777774;
  --kov-muted: #484846;

  --kov-border: #272727;
}
```

*(Aligné sur la fiche de tokens "Liquid Glass" du 2026-08-18 — légèrement ajusté depuis les valeurs d'origine.)*

Répartition : **75% noir / 17% blanc-gris / 8% rouge**.

Le rouge n'est jamais décoratif. Il signifie toujours : action / progression / focus / interaction / direction.

### Usage du noir

Le noir est l'espace principal de KOV — il représente silence / architecture / profondeur / contrôle.

Éviter un simple fond `#000`. Utiliser plusieurs profondeurs pour éviter l'impression de site plat :

- `#0A0A0A` — espace
- `#111315` — surface
- `#181D20` — profondeur
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
| `/kov/brand/kov-wordmark-bone.png` | Wordmark principal, fond transparent (rogné, sans halo) — celui utilisé dans le code (nav, sidebar admin, topbar client) |
| `/kov/brand/kov-wordmark-bone-on-black.png` | Wordmark source, blanc sur noir plein (référence design, non utilisé directement en UI) |
| `/kov/brand/kov-wordmark-black-on-bone.png` | Wordmark, noir sur blanc cassé |
| `/kov/brand/kov-signature-red-dot.png` | Signature `KOV.` avec le point rouge |
| `/kov/brand/kov-monogram-k.png` | Monogramme `K`, favicon / espaces réduits |

*(2026-08-20 : l'ancien wordmark était composité en direct via `mix-blend-mode: screen` + un recadrage `object-cover` sur un canevas non rogné, ce qui écrasait les bords du K et du V et laissait un léger halo sur les fonds non noirs. `kov-wordmark-bone.png` est un export rogné à la bounding box réelle du glyphe avec une vraie transparence alpha, affiché en `object-contain` — plus de recadrage ni de blend mode nécessaires.)*

## Typographie

Une seule famille : **Space Grotesk** (Light/Regular/Medium/Bold), pour le display comme pour l'UI/body — remplace l'ancien duo Archivo Narrow + Geist (2026-08-18). Geist Mono reste utilisé ponctuellement pour les petits repères techniques (numéros d'étapes, indicateur de scène).

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
