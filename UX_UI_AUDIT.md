# Audit UX/UI — KOV

**Date :** 17 septembre 2026
**Cadre :** 20 lois de design et psychologie cognitive appliquées au site existant.

---

## Ce que l'audit a cherché, et ce qu'il a trouvé

L'interface est **beaucoup plus saine que ce à quoi on s'attend d'un site construit au vibe coding**.
Un seul `<h1>` par page. Zéro bouton-icône sans nom accessible sur 223 composants. 102 `aria-label`.
17 modales avec `role="dialog"` et `aria-modal`. Une hiérarchie de CTA correcte — un seul
`variant="primary"` par section, un seul `KovCTA emphasis` dans le hero. Le tunnel de contact est déjà
découpé en étapes avec un récapitulatif éditable. Rien de tout cela n'avait besoin d'être corrigé.

Le vrai défaut est ailleurs, et il est systémique : **le site est conçu pour la souris, et pour elle
seule.** Il masque le curseur natif (`cursor: none`), n'avait de style de focus que sur 12 éléments,
et supprimait activement l'indicateur de focus sur 17 contrôles sans rien mettre à la place. Un
visiteur au clavier — ou au lecteur d'écran, ou simplement quelqu'un dont la souris vient de lâcher —
naviguait à l'aveugle.

Le second défaut est un classique de formulaire : **le tunnel de contact demandait au visiteur de
faire le travail que la machine sait faire.** Retaper son nom et son email que le navigateur connaît
déjà. Écrire son numéro de téléphone dans le seul format sur trois que la validation acceptait.
Avancer dans six étapes sans jamais savoir combien il en restait.

**Identité visuelle : inchangée.** Aucune couleur, typographie, animation signature, composition ou
ligne de contenu modifiée. Toutes les corrections ci-dessous sont soit invisibles à la souris, soit
un ajout dans le vocabulaire visuel déjà en place (filet, micro-capitales, rouge d'accent).

---

## CRITICAL

### 1 — Le site n'avait pas de style de focus

| | |
|---|---|
| **Pages** | Toutes |
| **Composant** | `src/app/globals.css`, + 14 fichiers |
| **Loi** | **04 — Jakob** (et accessibilité WCAG 2.4.7) |

**Problème.** Sur plusieurs centaines d'éléments interactifs, 12 définissaient un style de focus. Tout
le reste retombait sur le style par défaut du navigateur, quasi invisible sur un fond quasi noir. Pire :
**17 contrôles supprimaient l'indicateur avec `focus:outline-none` sans le remplacer** — dont la
recherche globale du site et le moteur de FAQ, tous deux publics. Le site masquant par ailleurs le
curseur natif, « où suis-je » est une question à laquelle l'interface doit répondre elle-même.

**Modification.**
- Une règle `:focus-visible` globale : contour rouge 2px avec `outline-offset`, qui épouse le
  `border-radius` de chaque élément.
- Écrite avec `:where()` → **spécificité zéro**, donc les 12 composants qui définissaient déjà leur
  propre focus (GlassSurface, les hotspots du studio, la pilule d'ActivationCard) continuent de gagner
  sans `!important`.
- `:focus-visible` et non `:focus` : **rien ne change pour un utilisateur à la souris, nulle part.**
- Les 12 contrôles admin sans remplacement retrouvent l'anneau global (le `focus:outline-none` nu a
  été retiré).
- Les deux barres de recherche publiques reçoivent l'anneau **sur leur conteneur** (`focus-within`) —
  la barre entière se lit comme un seul champ, ce qui est aussi meilleur visuellement.

**Impact attendu.** Le site devient navigable au clavier. C'est aussi un critère de conformité (RGAA
10.7 / WCAG 2.4.7) qui était en échec sur l'ensemble du site.

### 2 — Aucun lien d'évitement

| | |
|---|---|
| **Pages** | Toutes les pages marketing |
| **Composant** | `SiteChrome.tsx`, `globals.css`, 11 `<main>` |
| **Loi** | **04 — Jakob**, **16 — Parkinson** |

**Problème.** Au clavier, atteindre le contenu d'une page demandait de traverser la pilule de nav, ses
deux menus déroulants, la recherche et le CTA. Sur chaque page, à chaque fois.

**Modification.** Un lien « Aller au contenu » en première position du DOM, invisible jusqu'à ce qu'il
reçoive le focus — où il descend en rouge sous le bord haut. Chaque `<main>` public porte désormais
`id="kov-main"` et `tabIndex={-1}` pour être une cible de focus valide.

**Impact attendu.** Le parcours clavier passe de ~12 tabulations à 1 pour atteindre le contenu.

---

## HIGH

### 3 — Le menu mobile : pas de Échap, pas de sémantique, et focusable une fois fermé

| | |
|---|---|
| **Page** | Toutes, en dessous de `md` |
| **Composant** | `MobileNavMenu.tsx` |
| **Lois** | **04 — Jakob**, **02 — Fitts** |

**Problème.** C'est la navigation principale sur téléphone, et c'était la seule surcouche du site à ne
pas fermer avec Échap — `GlobalSearch`, `GlobalOverviewMenu` et les panneaux du studio le faisaient
tous déjà. Elle n'annonçait pas non plus qu'elle était une modale (`role`/`aria-modal` absents).

Et un vrai bug : le menu **reste monté quand il est fermé** (pour pouvoir fondre plutôt que
disparaître), avec seulement `opacity: 0`. Ses quatre liens **restaient donc dans l'ordre de
tabulation et dans l'arbre d'accessibilité** en permanence — un visiteur au clavier sur desktop
tabulait hors de la page pour atterrir sur quatre liens que personne ne voyait.

Le bouton de fermeture ✕ était un caractère de 24px sans zone cliquable, dans le coin le plus
difficile à atteindre au pouce.

**Modification.** `role="dialog"` + `aria-modal` + `aria-label` ; gestionnaire Échap ; `inert` quand
fermé (retire le sous-arbre de l'ordre de tabulation **et** de l'arbre d'accessibilité) ; bouton de
fermeture porté à 44×44 — **le glyphe est inchangé, seule la cible grandit.**

### 4 — Le téléphone refusait deux Français sur trois

| | |
|---|---|
| **Page** | `/contact` |
| **Composant** | `ContactWizard.tsx` |
| **Loi** | **13 — Postel** |

**Problème.** La validation était :

```
/^(\+33|0)\s*[1-9](\s*\d{2}){4}$/
```

Elle accepte l'espace, et **rien d'autre**. Donc `06.12.34.56.78` et `06-12-34-56-78` — deux des trois
façons dont ce numéro s'écrit en France — recevaient « Ce numéro de téléphone n'est pas valide » à
propos d'un numéro parfaitement valide. Sur un champ **facultatif**, dit à quelqu'un qui venait de
répondre à cinq questions. Idem pour `0033…`, les parenthèses, et l'espace insécable qui arrive avec
un copier-coller.

**Modification.** `normalizePhone()` : on retire tout ce qui n'est ni chiffre ni `+`, on ramène
`+33` / `0033` à `0`, **puis** on valide les chiffres — exactement aussi strictement qu'avant. Le
numéro est réécrit en `06 12 34 56 78` avant envoi, donc le CRM reçoit une forme unique.

Vérifié sur 15 cas : les 8 formats réels passent tous, les 5 entrées réellement invalides
(`0012345678`, 9 chiffres, 11 chiffres, du texte, un numéro américain) sont toujours refusées.
**La validation n'est pas assouplie, seule la ponctuation est pardonnée.**

L'email est aussi mis en minuscules et détouré — une majuscule automatique de clavier mobile n'est pas
une raison de refuser une adresse.

### 5 — Le formulaire ne se souvenait de rien que le navigateur savait déjà

| | |
|---|---|
| **Page** | `/contact` |
| **Composant** | `ContactWizard.tsx` |
| **Loi** | **12 — Tesler** |

**Problème.** Les quatre champs (nom, email, entreprise, téléphone) n'avaient **aucun attribut
`autoComplete`**. Le navigateur connaît ces valeurs et ne pouvait pas les proposer. Chaque visiteur
retapait à la main ce qui aurait dû être un appui.

**Modification.** `autoComplete="name" / "email" / "organization" / "tel"`, plus `inputMode` pour
obtenir le pavé numérique sur mobile sur le téléphone, et `autoCapitalize="off"` + `spellCheck={false}`
sur l'email. Chaque champ reçoit aussi un `aria-label` — un `placeholder` n'est pas un label, il
disparaît dès la première frappe.

**Impact attendu.** L'étape la plus coûteuse du tunnel passe de quatre saisies à un appui pour la
majorité des visiteurs.

### 6 — Six étapes, et aucun moyen de voir la fin

| | |
|---|---|
| **Page** | `/contact` |
| **Composant** | `ContactWizard.tsx` |
| **Lois** | **18 — Gradient d'objectif**, **17 — Zeigarnik** |

**Problème.** Chaque étape affichait son propre numéro (« 3 »), sans jamais dire sur combien. Et les
réponses validées s'empilaient au-dessus : **le seul signal visible était que le formulaire
s'allongeait** — exactement l'inverse de ce qu'il fallait montrer. On ne s'accélère pas vers une ligne
d'arrivée qu'on ne voit pas.

**Modification.** Au-dessus du récapitulatif : « Étape 3 sur 6 » à gauche, « Encore 3 » (puis
« Dernière étape ») à droite, et un filet de 2px qui se remplit en rouge. `role="progressbar"` avec
`aria-valuenow`/`aria-valuetext` pour que ce soit annoncé aussi.

**Vocabulaire visuel inchangé :** un filet et une ligne de micro-capitales, deux choses déjà partout
sur le site.

### 7 — Le message d'erreur ne disait pas quel champ

| | |
|---|---|
| **Page** | `/contact` |
| **Composant** | `ContactWizard.tsx` |
| **Lois** | **05 — Doherty**, **10 — Prägnanz** |

**Problème.** L'erreur s'affichait sous les quatre champs, à charge pour le visiteur de deviner lequel.
Elle n'était pas annoncée aux lecteurs d'écran.

**Modification.** `role="alert"` sur le message ; `aria-invalid` sur le champ concerné, dont la
bordure passe au rouge ; et **le focus est déplacé sur ce champ**. Le curseur est déjà au bon endroit
quand on lit l'erreur.

---

## MEDIUM

### 8 — L'étape « délai » était la seule sur deux colonnes

| | |
|---|---|
| **Page** | `/contact` · **Loi** | **08 — Similarité**, **10 — Prägnanz** |

Trois options sur une grille à 2 colonnes : la troisième se retrouvait seule sur sa ligne, alors que
les deux autres étapes de choix du même formulaire utilisent `grid-cols-1 sm:grid-cols-3`. Trois
contrôles identiques ne doivent pas se présenter de trois manières différentes. Aligné sur ses
jumelles.

### 9 — Le menu de partage ne fermait pas au clavier

| | |
|---|---|
| **Page** | `/journal/[slug]` · **Loi** | **04 — Jakob** |

`ShareMenu` fermait au clic extérieur — donc un visiteur au clavier ne pouvait pas le fermer du tout.
Échap ajouté.

### 10 — Cibles tactiles du footer sous le seuil

| | |
|---|---|
| **Pages** | Toutes · **Loi** | **02 — Fitts** |

Les trois icônes sociales faisaient 40×40 (conforme WCAG AA à 24px, sous le seuil confortable de 44).
Portées à 44×44 — **l'icône à l'intérieur ne bouge pas**, la rangée se lit pareil.

### 11 — Les deux CTA de `/merci` ne pouvaient pas passer à la ligne

| | |
|---|---|
| **Page** | `/merci` · **Loi** | **02 — Fitts** |

Deux boutons en `px-6` côte à côte passent tout juste sur 320px. `flex-wrap` ajouté : aucune différence
au-dessus, une assurance en dessous.

---

## Audit du design system

**Ce qui est cohérent.** Les couleurs sont entièrement tokenisées et exposées à Tailwind via
`@theme inline` — aucun hex en dur dans les composants (les deux exceptions, `CursorGrid` et `KovCTA`,
sont documentées : un canvas `fillStyle` ne sait pas lire une variable CSS). L'échelle de z-index est
une vraie échelle, documentée, avec un `--z-canvas` négatif justifié par la spec du painting order.
La typographie tient sur trois familles réellement utilisées, chargées par `next/font`.

**Ce qui ne l'est pas — les deux incohérences réelles, non corrigées :**

**Le border-radius.** 5 tokens définis (`4 / 8 / 12 / 18 / 999`), **18 valeurs distinctes en dur dans
le code** : 1, 2, 4, 5, 6, 8, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 30, 999, sur 316 déclarations.
L'échelle est une intention, pas une contrainte. **Je ne l'ai pas normalisée** — arrondir 20→18 et
14→12 sur des dizaines de composants change l'aspect du site partout, et je n'ai aucun moyen de le
vérifier (voir plus bas).

**La micro-typographie.** 138 × `text-[10px]`, 39 × `text-[9px]`, 6 × `text-[8px]`. Les micro-capitales
en `tracking-widest` **sont** la direction artistique du site et ne doivent pas disparaître. Mais 8px
n'est lisible pour personne, et les six occurrences sont identifiées ci-dessous. C'est un arbitrage de
design, pas une correction mécanique.

**Symptômes « IA » recherchés.** Gradients génériques : absents. Glow excessif : absent. Sections
toutes identiques : non — les sections de l'accueil ont chacune une composition propre (runway épinglé,
coverflow, éditorial). Alternance systématique texte/image : non. Hero SaaS générique : non. Tout
centré : non. Le grief le plus défendable serait la densité de cartes sur l'accueil, mais elles
appartiennent à trois systèmes visuels distincts, ce qui est un choix et non un défaut.

---

## Ce que je n'ai pas touché, délibérément

- **Aucune animation signature.** Les durées du wizard (140/180/280 ms) restent telles quelles : le
  retour visuel de la sélection, lui, est déjà immédiat (seuil de Doherty respecté), seule la
  transition d'étape prend son temps, et c'est un choix de rythme.
- **Aucune normalisation de radius, de cartes ou de sections.** L'énoncé interdit d'uniformiser le
  design pour satisfaire une règle, et je ne peux rien vérifier visuellement.
- **Les boutons de choix du wizard gardent `aria-pressed`.** Sémantiquement un `radiogroup` serait plus
  juste, mais cela impose une navigation aux flèches et change le comportement clavier — un arbitrage,
  pas une correction.
- **Aucun contenu éditorial modifié.**

---

## Vérification

`npx tsc --noEmit` propre · `npm run lint` au niveau de référence du projet (3 erreurs, 2
avertissements préexistants, sans rapport) · `npm run build` propre. Présence du lien d'évitement et
des ancres `#kov-main` confirmée dans le HTML prérendu ; `inert` confirmé dans le bundle.

**Rien n'a été vérifié visuellement.** Aucun navigateur n'est lancé sur ce projet (règle permanente) et
le serveur MCP Playwright refuse la connexion. Les tests desktop / tablette / mobile / clavier /
tactile demandés en PHASE 5 **n'ont pas pu être exécutés** : ils demandent un vrai navigateur. Les
corrections ci-dessus ont donc toutes été choisies pour être vérifiables au code — sémantique,
attributs, logique de validation — et pour ne rien changer au rendu à la souris.

---

## Décisions humaines requises

**1. Les liens sociaux du footer mènent tous à `/contact`.**
Trois liens annoncés « LinkedIn », « Instagram » et « X » à un lecteur d'écran, qui ouvrent la page
contact. C'est une attente rompue (loi de Jakob), et c'est plus dommageable que de ne pas les afficher.
Le code le sait — un commentaire le note comme provisoire. **Deux issues : fournir les vraies URL, ou
retirer la rangée.** Je n'ai pas tranché : c'est une décision de marque.

**2. Que promet `/merci` ?**
La page dit « On revient vers vous rapidement » sans dire quand ni comment — alors que le formulaire
vient de collecter précisément le mode de contact souhaité et le délai. C'est le dernier moment du
tunnel, donc celui qui pèse le plus (règle pic-fin), et c'est le plus vague. Le reformuler demande un
engagement réel (« sous 24 h ouvrées ») que je ne peux pas inventer. **Donne-moi le délai et je
l'écris**, avec la reprise du canal choisi.

**3. Les six `text-[8px]`.**
`PerformanceContent.tsx` (×2), `Studio360Content.tsx`, `StudioMapExpanded.tsx`,
`StudioMusicPlayer.tsx` (×2). Passer à 10px les aligne sur le reste du site et les rend lisibles ;
c'est aussi 2px de plus dans des compositions calibrées au pixel. **Ton appel.**

**4. L'échelle de border-radius.**
Soit on étend les tokens pour couvrir ce qui est réellement utilisé (honnête, sans effet visuel), soit
on ramène les 18 valeurs vers 5 (cohérent, mais modifie l'aspect partout et demande une relecture
écran par écran). Je recommande la première maintenant, la seconde quand un navigateur sera
disponible.

**5. Admin et espace client.**
Le lien d'évitement ne s'applique qu'aux pages marketing — `/admin` et `/client` ont leur propre
coquille avec barre latérale, donc un autre problème de parcours clavier. Ils bénéficient déjà de
l'anneau de focus global et des corrections de contrôles. Un audit dédié de ces deux espaces est un
chantier à part.
