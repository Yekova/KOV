# KOV — Motion & Interface System

## Principe

**Motion = communication, jamais décoration.**

Les mouvements doivent être : lents / précis / contrôlés / lisibles.

Éviter : spring exagéré, bounce, animations molles, éléments qui flottent partout, parallaxe excessive.

## Vitesse

Les animations KOV ont une sensation légèrement plus lente que les interfaces classiques — mais jamais lourde.

```ts
export const motion = {
  micro: 0.18,
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
  cinematic: 1.2,
};
```

Voir `src/lib/motion/timing.ts`.

## Grammaire des transitions

**Interdit** de créer des transitions standard type `fade → nouvelle section` entre chaque partie.

**Privilégier** : traverser, déplier, séparer, ouvrir, zoomer, pivoter, recomposer, absorber, fragmenter.

Une section doit souvent devenir la suivante physiquement (ex : wireframe → interface → système → architecture → projet), jamais un simple enchaînement.

## Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-pill: 999px;
```

Boutons/cartes rectangulaires ou légèrement arrondis (`sm`/`md`) par défaut. `--radius-pill` est réservé à deux usages précis introduits par le système de composants "Liquid Glass" (2026-08-18) : le CTA `Contact us` de la nav, et les tag pills (`TagPill`) — pas un style de fond général.

## Composants (2026-08-18)

Système de composants réutilisables dans `src/components/ui/` :
- **`Button`** — variantes `primary` (rouge plein, CTA principal de page), `secondary` (bordure, existant), `ghost` (texte seul), `pill` (nav/CTA compact)
- **`GlassCard`** — carte en verre liquide (cf ci-dessous), pour les cartes projet et le panneau de formulaire
- **`TagPill`** — petit tag bordé arrondi (discipline, catégorie)
- **`GlassSphere`** — sphère décorative flottante (motif visuel ponctuel, `aria-hidden`, jamais porteuse de contenu)

## Liquid Glass

Couche fonctionnelle flottant au-dessus du monde brutaliste. Le contraste environnement lourd / interface légère est intentionnel.

Un flat `rgba(18,18,18,x)` sur fond quasi-noir ne lit pas comme du verre — juste comme une boîte plus sombre (déjà expédié une fois, corrigé après retour utilisateur). La vraie recette, dans `src/styles/tokens.css` :

```css
--glass-tint-top: rgba(255, 255, 255, 0.09);
--glass-tint-bottom: rgba(255, 255, 255, 0.02);
--glass-border: rgba(255, 255, 255, 0.16);
--glass-highlight: rgba(255, 255, 255, 0.16);
--glass-shadow: rgba(0, 0, 0, 0.45);
--glass-blur: 20px;
--glass-bg: linear-gradient(160deg, var(--glass-tint-top), var(--glass-tint-bottom));
--glass-shadow-full: inset 0 1px 0 var(--glass-highlight), inset 0 0 0 1px rgba(255, 255, 255, 0.03),
  0 8px 30px var(--glass-shadow);
```

Un tint **clair** et translucide (pas une teinte sombre) + `backdrop-filter: blur(20px) saturate(180%)` + une bordure et un rim highlight lumineux, sur fond noir : c'est le contraste tint clair / environnement sombre qui lit comme "verre", pas l'opacité seule.

**Usage** : navbar, cartes projet (`GlassCard`), panneau de formulaire, modal, filtre, label, CTA secondaire, sphères décoratives (`GlassSphere`), bouton menu global.

**Ne pas** appliquer le glass à toutes les sections — c'est une couche fonctionnelle ponctuelle sur des composants précis, pas un style de fond systématique pour les blocs de texte courants. Le rouge KOV reste rare : signal/action, jamais couleur de remplissage.

## Z-index

Décision à figer immédiatement, ne jamais improviser un z-index ailleurs. Échelle réelle (`src/styles/tokens.css`) :

```
0     --z-canvas            fond WebGL / image
10    --z-atmosphere        dégradés atmosphériques
20    --z-layer-secondary   plan 3D secondaire
30    --z-content           contenu éditorial HTML
40    --z-glass             UI glass contextuelle
50    --z-nav               navigation, bouton menu global
60    --z-modal             modales, menu global plein écran
70    --z-cursor            curseur custom
```

Le curseur doit être au-dessus de tout (il remplace le curseur OS) — modal et cursor ont été inversés une fois par erreur, gardez cet ordre.

## Moteur d'animation

Deux systèmes coexistent délibérément, chacun sur son terrain :

- **CSS + `IntersectionObserver`** (`Reveal.tsx`, `src/lib/motion/`) — reste le défaut pour tout ce qui est "cet élément apparaît quand il entre dans le viewport." Pas de dépendance, c'est ce qui a construit tout le site jusqu'ici.
- **GSAP + ScrollTrigger** (`src/lib/motion/scroll.ts`, `transitions.ts`) — ajouté (2026-08-27, décision explicite utilisateur) uniquement pour ce que `IntersectionObserver` ne peut pas faire : un scroll *scrubbed* précis (la progression de l'animation suit la position de scroll frame par frame, pas juste "visible/pas visible"), des scènes pinned multi-éléments, des morphs carte-à-carte. Ne pas l'utiliser pour un simple fade-in — `Reveal` fait déjà ça, sans dépendance.

`src/lib/motion/easing.ts` définit `LIQUID_EASE`/`REVEAL_EASE` comme de simples points de contrôle bezier, rendus à la fois en chaîne CSS et en `CustomEase` GSAP (`GSAP_LIQUID_EASE`/`GSAP_REVEAL_EASE`) — une seule courbe, deux syntaxes, pour que le CSS existant et les nouvelles animations GSAP partagent exactement la même sensation.

`src/lib/motion/transitions.ts` centralise les presets réutilisables (`fadeUpIn`, `dissolve`, `staggerReveal`, `pinAndTrack`) — les nouvelles sections doivent passer par ces helpers plutôt que d'écrire des tweens GSAP à la main, pour que duration/easing/stagger restent cohérents section par section.

## Rythme global

Ne jamais enchaîner les effets wow en continu. Le rythme doit alterner :

```
WOW → SILENCE → INFORMATION → WOW → SILENCE → PROJECT → WOW
```

La sobriété entre deux moments forts rend les transformations plus fortes.
