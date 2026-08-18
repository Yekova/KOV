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

Voir `src/lib/motion.ts`.

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

```css
--glass-soft: rgba(18, 18, 18, 0.42);
--glass-medium: rgba(18, 18, 18, 0.58);
--glass-strong: rgba(18, 18, 18, 0.72);
```

```css
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, .12);
```

**Usage** : navbar, cartes projet (`GlassCard`), panneau de formulaire, modal, filtre, label, CTA secondaire, sphères décoratives (`GlassSphere`).

**Ne pas** appliquer le glass à toutes les sections — c'est une couche fonctionnelle ponctuelle sur des composants précis, pas un style de fond systématique pour les blocs de texte courants.

## Z-index

Décision à figer immédiatement, ne jamais improviser un z-index ailleurs :

```
0     Canvas background
10    atmospheric effects
20    secondary 3D layer
30    editorial HTML content
40    contextual glass UI
50    navigation
60    cursor
70    modal
```

## Rythme global

Ne jamais enchaîner les effets wow en continu. Le rythme doit alterner :

```
WOW → SILENCE → INFORMATION → WOW → SILENCE → PROJECT → WOW
```

La sobriété entre deux moments forts rend les transformations plus fortes.
