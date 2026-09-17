# Audit de performance — KOV

**Date :** 17 septembre 2026
**Stack :** Next.js 16.3.5 (App Router, Turbopack) · React 19.2 · TypeScript · Tailwind v4 · Supabase · Vercel

---

## Résumé

Le site n'était pas lent à cause de son architecture — elle est saine. Il était lent parce qu'il
**téléchargeait des choses que personne ne regardait** : une librairie d'animation qui n'animait rien,
un moteur 3D complet devant le texte des CGV, un shader WebGL dans le bundle critique de chaque page,
et une vidéo de 7 Mo qui partait au chargement de l'accueil alors qu'elle est cinq sections plus bas.

**Aucun changement de design, d'animation, de texte ou de parcours.** Les corrections déplacent du code
dans le temps (chargé plus tard) ou le suppriment (il ne servait à rien). Rien n'a été retiré à l'écran.

### Méthode de mesure

Les chiffres JS viennent du HTML prérendu (`.next/server/app/*.html`) : somme des `<script src>` pointant
vers `/_next/static/chunks/`, **hors chunk `noModule`**. Ce dernier (110 Ko de polyfills core-js) est le
fallback legacy de Next et n'est **jamais téléchargé par un navigateur moderne** — le compter aurait
gonflé les chiffres des deux côtés. Tailles **non compressées** (avant gzip/brotli du CDN Vercel).

Ce qui **n'a pas** pu être mesuré : LCP, INP, CLS, Lighthouse. Aucun navigateur n'a été lancé — c'est la
règle permanente sur ce projet — et le serveur MCP Playwright refuse la connexion (`CONNECT_TIMEOUT`).
Tout ce qui est marqué **Non mesuré** ci-dessous l'est réellement : rien n'a été estimé ni inventé.

---

## Problèmes identifiés

Classés par impact. Chacun a été vérifié dans le code avant d'être corrigé — aucun n'est une supposition.

### CRITICAL

**1 — `public/home/studio-showreel.mp4` (7,14 Mo) téléchargée au chargement de l'accueil**

*Fichier :* `src/components/home/StudioShowcase.tsx`

Deux `<video>` (desktop / mobile) coexistent dans le DOM, CSS choisit laquelle afficher. Deux problèmes
se cumulaient :

- la variante desktop portait `preload="auto"` — soit « télécharge tout, tout de suite » — pour une
  section située cinq écrans plus bas ;
- `display:none` **n'exempte pas** un élément média de l'algorithme de chargement. Un téléphone était
  donc éligible à télécharger la variante desktop **en plus** de la sienne.

*Impact :* jusqu'à 7 Mo en concurrence directe avec les ressources critiques de l'accueil, sur la
connexion la plus lente comme sur la plus rapide.

*Correction :* nouveau hook `src/hooks/useLazyVideoSrc.ts`. Le `src` n'est plus une prop JSX mais est
attaché par un `IntersectionObserver` à l'approche du viewport. Un élément `display:none` n'a pas de
boîte, donc n'intersecte jamais, donc **ne se charge jamais** — le bug mobile disparaît par construction.
Le `poster` tient l'image jusqu'à l'arrivée des données : la section est visuellement identique à tout
moment du scroll, et le `aspect-ratio` réservait déjà la place (pas de CLS introduit ni corrigé).

**2 — `LightPillar` mettait Three.js complet devant le texte des pages légales**

*Fichier :* `src/app/legal/layout.tsx`

Le layout partagé de `/legal/*` importait statiquement un décor WebGL ambiant. Résultat : **les six
pages légales étaient plus lourdes que la page d'accueil** (1 444 Ko contre 938 Ko) — pour du texte
juridique.

*Correction :* `src/components/legal/LightPillarLazy.tsx` (frontière `ssr: false` — le layout est un
Server Component, la frontière doit vivre dans son propre module client). Le décor est `fixed`,
`pointer-events: none`, en `--z-canvas` : il n'avait aucune forme rendue côté serveur, donc rien à
préserver.

### HIGH

**3 — AOS chargé sur chaque page du site, sans rien animer**

*Fichiers :* `src/app/layout.tsx`, `src/components/ui/AosInit.tsx`

`AosInit` était monté dans le layout racine → moteur JS + feuille CSS AOS sur **toutes** les pages.
Vérifié : **zéro attribut `data-aos`** dans le code (les deux occurrences étaient des commentaires
dans AosInit lui-même). La librairie n'animait rien et n'avait jamais rien animé.

*Correction :* composant supprimé, `aos` et `@types/aos` désinstallés.

**4 — `SpecularButtonEffect` mettait `ogl` dans le bundle critique de chaque page**

*Fichier :* `src/components/ui/Button.tsx`

`Button` rend cet effet WebGL, et `Button` est dans `Nav` et `Footer` → `ogl` (~110 Ko) sur
**littéralement toutes les pages**, pour un reflet qui n'apparaît qu'au survol.

*Correction :* `SpecularButtonEffectLazy.tsx`. Le composant était **déjà** protégé à l'exécution par un
`IntersectionObserver` (il ne crée un contexte WebGL que si son bouton est à l'écran — une bonne décision
déjà en place, qui évitait de saturer la limite de contextes WebGL du navigateur). Différer le *module*
suit exactement la même logique : l'import se résout à peu près au moment où l'observer se serait
déclenché. Rien ne change à l'écran.

**5 — `@/lib/motion` : un barrel qui faisait payer GSAP à qui voulait quatre nombres**

*Fichiers :* `src/lib/motion/*` et 14 composants

Le barrel réexportait `gsap` / `ScrollTrigger` **à côté** des constantes pures. `./scroll` importe gsap
au niveau module et gsap n'est pas *side-effect-free* : impossible à tree-shaker. Quatorze composants
importaient le barrel pour `LIQUID_EASE` (quatre nombres) ou `prefersReducedMotion` (une media query) et
récupéraient GSAP + ScrollTrigger + CustomEase avec — **~118 Ko pour un booléen**. Parmi eux `Nav.tsx` et
`GlobalSearch.tsx`, présents sur chaque page.

*Correction :* `prefersReducedMotion` extrait dans `src/lib/motion/reducedMotion.ts` (aucun import), les
14 fichiers pointent vers la feuille qu'ils utilisent réellement. `scroll.ts` le réexporte : aucun
chemin d'import existant ne casse.

**6 — `SmoothScroll` (lenis + ticker GSAP) dans le bundle critique de chaque page marketing**

*Fichier :* `src/components/layout/SiteChrome.tsx`

~160 Ko pour un composant qui **rend `null`** — il n'y avait rien dans le HTML serveur à préserver.

*Correction :* `next/dynamic` avec `ssr: false`. Le scroll inertiel démarre un chunk plus tard ; sur
connexion lente c'est toujours plus tôt que le moment où l'ancien bundle finissait d'être parsé, puisque
c'est l'hydratation qui conditionne le scroll fluide en premier lieu. **Compromis assumé et signalé :**
si le tout premier coup de molette arrive avant l'arrivée du chunk, il est natif au lieu d'inertiel.

**7 — Carte 3D du studio chargée avant le panorama que le visiteur attend**

*Fichier :* `src/components/studio/StudioExperience.tsx`

La carte du HUD est une **seconde scène WebGL** (~1 500 lignes de géométrie + `OrbitControls`,
`Environment`, `ContactShadows` de drei). Elle attendait déjà une frame d'inactivité avant de se monter
(`mapReady`), mais son code était dans le premier bundle du studio.

*Correction :* `next/dynamic`. Le fetch démarre désormais sur le même temps que le rendu.

**8 — `FluidGlassCursor` : composant mort important `maath` + `three`**

Zéro importeur. Supprimé, `maath` désinstallé.

### MEDIUM

**9 — L'image de couverture des articles était un `<img>` brut**

*Fichier :* `src/components/journal/PostView.tsx`

C'est **l'élément LCP de chaque article**, servi à la résolution d'upload, sans `srcset` ni conversion.

*Correction :* `next/image` avec `sizes="(min-width: 816px) 768px, 100vw"` (colonne `max-w-3xl`) et
`priority`. **Avec une garde :** `resolvePostImageUrl` laisse passer toute valeur commençant par `http`,
donc une couverture peut être une URL externe que `remotePatterns` n'autorise pas — l'optimiseur répond
400 et **l'article entier tomberait**. Le `<img>` reste le fallback dans ce cas. `remotePatterns` n'a
délibérément **pas** été élargi : un proxy d'images ouvert vaut plus à un attaquant que l'optimisation ne
nous vaut.

**10 — `next/image` n'émettait que du WebP**

*Fichier :* `next.config.ts` — `formats: ["image/avif", "image/webp"]` ajouté (~20 % de moins encore).
`minimumCacheTTL` laissé à 4 h **volontairement** : les couvertures d'articles sont uploadées en
`upsert: true` sur un chemin déterministe, donc remplacer une couverture réutilise son URL. Un TTL long
servirait l'ancienne image pendant toute sa durée.

**11 — `fill` sans `sizes` dans la sidebar légale**

*Fichier :* `src/components/legal/LegalSidebar.tsx` — Next supposait `100vw` et servait la variante
pleine largeur pour une boîte de 300 px. `sizes` ajouté.

**12 — `CustomCursor` écrivait `transform` à chaque `mousemove`**

*Fichier :* `src/components/ui/CustomCursor.tsx` — `mousemove` se déclenche plus vite que le compositeur
ne peint. Coordonnées enregistrées sur l'événement, **une écriture par frame** via rAF ; position
identique. Les trois listeners passent en `passive` (aucun n'appelle `preventDefault`).

**13 — TipTap dans le bundle de la fiche lead**

*Fichier :* `src/components/email/LeadEmailPanel.tsx` — `EmailComposer` (~300 Ko d'éditeur) n'était rendu
que si `composerOpen`, mais importé statiquement. Chargé au clic maintenant.

### Hors performance — trouvé pendant l'audit

**14 — Le widget « dernier article » de l'accueil était gelé depuis le dernier déploiement**

*Fichiers :* `src/scenes/HeroScene.tsx`, `src/app/page.tsx`, `src/app/admin/content/actions.ts`

`HeroScene` lit le dernier article publié dans Supabase, mais `/` était un prérendu **build-time pur**
et `revalidatePath("/")` n'était **jamais** appelé — les actions de publication ne revalidaient que
`/journal` et `/journal/[slug]`. Publier un article ne mettait donc **jamais** l'accueil à jour.
C'est exactement le défaut qui vidait `/journal`, à un deuxième endroit. En prime son erreur Supabase
était avalée de la même façon (`const { data }` seul).

*Correction :* `revalidatePath("/")` sur les 4 actions concernées, `revalidate = 300` en filet de
sécurité pour une publication faite directement dans Supabase, et l'erreur est journalisée.

---

## Base de données

**Verdict : rien à corriger.** C'est la partie la plus saine du projet, et l'inverse de ce que l'audit
cherchait. Vérifié explicitement :

| Point cherché | Constat |
|---|---|
| Requêtes N+1 | **Aucune.** Les listes récupèrent leurs relations par `in(ids)` après un `Set` d'ids. |
| Appels séquentiels | **Aucun.** `Promise.all` partout, y compris les 17 requêtes du dashboard admin. |
| `select("*")` | 10 occurrences, dont 8 sur un `maybeSingle()` d'une seule ligne — sans objet. |
| Filtrage côté client | Non trouvé sur du volume ; les filtres sont en SQL. |
| `limit()` sur les listes de recherche | Présent (`SEARCH_LIMIT`). |
| Index | **40+ index**, y compris composites et partiels (`where read_at is null`, `where status = 'paid'`). Couvre les colonnes de `where` / `order by` réellement utilisées. |
| Pooling | Configuration Supabase standard, non modifiée — elle est correcte. |

**Aucun index ajouté.** Le seul candidat théorique serait `posts (status, sort_order, published_at desc)`
pour la liste du journal (l'index actuel `(status, published_at desc)` laisse un tri résiduel sur
`sort_order`). Sur une table de quelques articles, c'est un gain nul et un index de plus à maintenir —
contraire au principe « une optimisation doit résoudre un problème réel ».

**Middleware :** `src/proxy.ts` a un `matcher` limité à `/admin` et `/client`. Aucune page publique ne le
traverse. Déjà optimal, non modifié.

---

## Frontend

- Découpage : 4 nouveaux points de `next/dynamic` (`LightPillar`, `SpecularButtonEffect`, `StudioMap3D`,
  `EmailComposer`) + `SmoothScroll`. Les 6 wrappers `*Lazy.tsx` préexistants étaient déjà bien placés.
- Barrel `@/lib/motion` éclaté en feuilles ; `prefersReducedMotion` isolé.
- 2 composants morts supprimés, 3 dépendances désinstallées.
- `"use client"` : 216 composants sur 223. Vérifié — ce site est une expérience animée (WebGL, scroll
  scrubé, curseur custom), la quasi-totalité de ces composants est réellement interactive. **Aucun
  déplacement de frontière serveur/client n'a été fait** : le gain serait marginal et le risque de
  régression réel. Les pages restent des Server Components qui fetchent côté serveur.

---

## Assets

- Vidéo showreel : de « téléchargée systématiquement » à « téléchargée si et quand elle approche ».
- AVIF activé pour tout ce qui passe par `next/image`.
- Couverture d'article et image de sidebar légale corrigées (ci-dessus).
- **Aucun fichier n'a été supprimé ni recompressé** — voir « Optimisations restantes ».
- Polices : `next/font/google` (Archivo Black 400, Inter variable, Geist Mono), auto-hébergées, `swap`
  par défaut. Les trois sont réellement utilisées (`font-mono` : 40 occurrences). **Rien à changer.**
- Scripts tiers : **aucun.** Vercel Analytics / Speed Insights vivent dans `CookieConsent`, actuellement
  désactivé dans le layout racine — zéro JS tiers expédié aujourd'hui.

---

## Cache

| Donnée | Stratégie | Raison |
|---|---|---|
| `/` (accueil) | ISR 300 s + `revalidatePath("/")` à la publication | Contient le dernier article ; était gelé au build |
| `/journal` | ISR 60 s + `revalidatePath` | Corrigé en amont de cet audit |
| `/journal/[slug]` | Dynamique par requête | Compteur de vues |
| `/expertise/*`, `/faq`, `/legal/*`, `/merci` | Statique | Contenu en dur, change au déploiement |
| `/admin/*`, `/client/*` | Dynamique, non caché | **Données privées — jamais mises en cache** |
| Images optimisées | 4 h (défaut) | Volontairement pas allongé : les couvertures réutilisent leur URL |

Aucune infrastructure ajoutée. Pas de Redis, pas de CDN externe, pas de worker — Vercel et Supabase
fournissent déjà ces couches.

---

## Résultats

### JavaScript initial par route (navigateur moderne, non compressé)

| Route | Avant | Après | Δ |
|---|---:|---:|---:|
| **socle partagé** (toute page) | 720 Ko | **590 Ko** | **−130 Ko (−18 %)** |
| `/legal/*` | 1 444 Ko | **598 Ko** | **−846 Ko (−59 %)** |
| `/studio` | 1 984 Ko | **1 708 Ko** | −276 Ko (−14 %) |
| `/contact` | 878 Ko | **748 Ko** | −130 Ko (−15 %) |
| `/journal` | 922 Ko | **792 Ko** | −130 Ko (−14 %) |
| `/faq` | 749 Ko | **619 Ko** | −130 Ko (−17 %) |
| `/` (accueil) | 938 Ko | **858 Ko** | −80 Ko (−9 %) |
| `/expertise`, `/merci`, 404 | 720 Ko | **590 Ko** | −130 Ko (−18 %) |

### Octets réseau

| Mesure | Avant | Après |
|---|---:|---:|
| Vidéo au chargement de l'accueil (desktop) | 7,14 Mo | **0 o** jusqu'à l'approche de la section |
| Vidéo au chargement de l'accueil (mobile) | jusqu'à 2 × 7,14 Mo | **0 o**, puis une seule variante |
| Requêtes Supabase | inchangé (déjà optimal) | inchangé |

### Core Web Vitals & Lighthouse

**Non mesuré.** Aucun navigateur n'a été lancé (règle permanente du projet) et le serveur MCP Playwright
échoue à se connecter. LCP, INP, CLS et les scores Lighthouse ne peuvent être obtenus que sur le site
déployé. Les corrections 1, 9, 10 et 11 visent le LCP, la 12 vise l'INP ; **aucun chiffre n'est avancé
pour autant.**

---

## Optimisations restantes

Celles-ci demandent **une décision de ta part** ou une vérification dans un vrai navigateur.

**1. GSAP sur chaque page — ~101 Ko, à cause de `NavLinks.tsx`.**
C'est le dernier gros bloc du socle partagé. `NavLinks` utilise GSAP pour l'animation de la pastille de
nav, et **pose l'état « rempli » du lien actif via `tl.progress(1)`**. Un import dynamique ferait donc
clignoter le lien actif non rempli à chaque chargement — une régression visuelle, pas une optimisation.
Le rendre CSS est faisable (la géométrie du cercle dépend de la hauteur mesurée de la pastille) mais ne
peut pas être validé sans navigateur. **Je ne l'ai pas fait : le cahier des charges interdit de dégrader
le design pour un score.**

**2. ~8,7 Mo d'assets non référencés dans `public/`.**
Aucune occurrence dans `src` — mais ils peuvent être référencés depuis la base (couverture d'article) ou
utilisés hors du dépôt. **Je ne les ai pas supprimés.** À confirmer avant suppression :
`kov/home/hero-cinematic.mp4` (4,35 Mo) · `kov/brand/kov-wordmark-bone-on-black.png` (1,57 Mo) ·
`kov/character/character-reference-sheet.png` (1,37 Mo) · `kov/brand/kov-wordmark-black-on-bone.png`
(0,77 Mo) · `kov/brand/kov-monogram-k.png` · `kov/brand/kov-signature-red-dot.png`.
Ils ne pèsent pas sur le runtime (rien ne les charge) — seulement sur la taille du déploiement.

**3. ~60 Mo de musique du studio en double format.**
9 morceaux en `.mp3` **et** `.webm/opus`. Le double est justifié (Safari ne lit pas l'Opus en WebM), et
`preload="none"` fait qu'aucun octet ne part avant un clic sur Lecture. Rien à corriger côté runtime ;
c'est un coût de dépôt et de déploiement, à arbitrer si tu veux alléger l'un ou l'autre.

**4. Coût GPU de l'accueil — à vérifier en conditions réelles.**
`LineWaves` (shader plein écran en `fixed`) tourne pendant tout le scroll, et `GradualBlur` empile
6 couches de `backdrop-filter` qui se re-rasterisent à chaque frame. Les deux sont des choix de design
délibérés, **je n'y ai pas touché**. Si l'accueil saccade sur une machine modeste, `divCount` de
`GradualBlur` et la résolution de `LineWaves` sont les deux molettes — mais ça se décide sur une mesure,
pas sur une intuition.

**5. Pagination admin.** `admin/billing` et `admin/quotes` font un `select("*")` sans `limit`. Sans objet
aux volumes actuels, à reprendre quand les factures se comptent par centaines. Non modifié : remplacer
`*` par une liste de colonnes sur une page qui les affiche presque toutes, c'est du risque sans gain.

**6. Refonte mobile de `ActivationWindow`** (empiler la colonne sticky au-dessus des cartes) — point
déjà identifié plus tôt, hors du périmètre de cet audit.

---

## Interdictions respectées

Aucun design refait · aucune animation supprimée · aucune fonctionnalité retirée · aucun texte modifié ·
aucun parcours changé · aucun secret exposé · aucune règle RLS touchée · aucune librairie supprimée sans
avoir vérifié qu'elle n'était pas utilisée (`aos` : 0 attribut `data-aos` ; `maath` : 0 importeur) ·
aucune infrastructure ajoutée.

**Vérifications :** `npx tsc --noEmit` propre · `npm run lint` au niveau de référence du projet
(3 erreurs, 2 avertissements préexistants et sans rapport) · `npm run build` propre, 59 pages générées.
