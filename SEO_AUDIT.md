# Audit SEO technique — KOV

**Date :** 17 septembre 2026
**Périmètre :** la chaîne complète — discovery → crawl → render → index → understanding → UX.

---

## 1. État actuel

**Le site était déjà correctement construit pour le SEO, et c'est inhabituel.** L'audit a cherché les
défauts classiques et en a trouvé peu :

- Un `<h1>` par page sur 13 des 16 routes publiques, des `<title>` uniques partout, des descriptions
  sur toutes les pages sauf une.
- Des `canonical` explicites sur 14 routes.
- Des données structurées réelles : `Organization` + `WebSite` sitewide, `BlogPosting` +
  `BreadcrumbList` sur les articles, `FAQPage` sur `/faq` (51 questions réelles), `Service` sur chaque
  page d'expertise.
- **Zéro lien interne cassé** sur 51 routes (vérifié par résolution de chaque `href` interne contre
  l'arborescence réelle).
- Un rendu serveur qui fonctionne : 7 519 caractères de texte réel dans le HTML de l'accueil, 12 309
  sur `/faq`. Google n'a pas besoin d'exécuter le JavaScript pour comprendre ces pages.
- Un middleware limité à `/admin` et `/client` : aucune page publique ne le traverse.

Les vrais problèmes étaient ailleurs, et ils sont de trois natures : **des pages privées exposées à
l'index**, **une carte sociale malformée**, et **du HTML choisi pour sa taille visuelle plutôt que pour
son sens**.

---

## 2. Problèmes critiques

### 2.1 — Aucune page 404

Le site n'avait pas de `not-found.tsx`. Next servait sa page par défaut : du noir sur blanc, aucune
trace de l'identité KOV, et **aucun chemin de retour dans le site**. Le code HTTP était correct (Next
renvoie bien un vrai 404, ce qui est ce qui compte pour l'indexation) — c'est tout le reste qui
manquait, pour le visiteur comme pour le crawler, qui arrivait dans un cul-de-sac.

### 2.2 — `Disallow` et `noindex` utilisés comme s'ils étaient la même instruction

`/login` était bloqué dans `robots.txt` **et lié depuis le footer de chaque page**. C'est le cas d'école
du pire des deux mondes : une URL interdite au crawl mais liée peut quand même être indexée — sous
forme d'URL nue, sans titre ni extrait — précisément parce que le crawler n'a pas le droit d'aller lire
la page qui lui aurait dit de ne pas l'indexer.

`/merci`, `/login/forgot` et `/login/reset` n'avaient **ni l'un ni l'autre** : entièrement indexables.
Une page de réinitialisation de mot de passe atteignable depuis Google est une page atteignable par
quelqu'un qui ne l'a pas demandée.

### 2.3 — La carte sociale était malformée partout

`og:image` pointait sur `kov-wordmark-bone.png` : **1116 × 209**, soit un ratio de 5,3:1. Toutes les
plateformes qui affichent un aperçu de lien attendent 1,91:1 (1200 × 630) et rognent ou encadrent le
reste. Chaque partage sur LinkedIn, X, Slack ou WhatsApp montrait le wordmark écrasé dans une bande ou
recadré sur deux lettres. La carte de visite du site, cassée à l'endroit exact où elle sert.

### 2.4 — Le favicon faisait 1448 × 1086

`src/app/icon.png` était un **doublon octet pour octet** de `kov-monogram-k.png` : 4:3, 335 Ko, déclaré
au navigateur en `sizes="1448x1086"`. Un favicon non carré est encadré ou déformé à 16 px. Le fichier
n'apportait rien : `src/app/favicon.ico` existe déjà et contient les quatre tailles correctes
(16/32/48/256) en 26 Ko.

---

## 3. Indexation

| Route | Avant | Après |
|---|---|---|
| `/`, `/expertise/*`, `/journal/*`, `/faq`, `/contact`, `/studio`, `/legal/*` | index | index |
| `/login` | `Disallow` + lié depuis le footer | **crawlable + `noindex, follow`** |
| `/login/forgot`, `/login/reset` | **indexable** | **`noindex, nofollow`** |
| `/merci` | **indexable** | **`noindex, follow`** |
| `/journal/preview/[id]` | ni l'un ni l'autre (mais `requireAdmin`) | **`Disallow` + `noindex, nofollow`** |
| `/admin/*`, `/client/*` | `Disallow` | `Disallow` (inchangé, voir ci-dessous) |
| `/api/*` | rien | **`Disallow`** |

`/admin` et `/client` restent en `Disallow` et non en `noindex` pour une raison précise : les deux
redirigent vers `/login` pour quiconque n'a pas de session (`src/proxy.ts`), donc **il n'existe aucune
page sur laquelle un `noindex` pourrait vivre**. Rien de tout cela n'est une barrière de sécurité — la
vraie barrière est le contrôle d'authentification ; `robots.txt` est un fichier public qui énonce à voix
haute ce qu'il liste.

Vérifié dans le HTML généré : 23 pages prérendues, **toutes avec exactement un `<h1>`** (sauf
`/login/reset`, dont le titre apparaît après vérification du lien — page en `noindex`), et les
directives `robots` présentes exactement là où elles doivent l'être.

---

## 4. Metadata

**Un seul titre dupliqué existait**, et sa cause était structurelle : `/legal/gestion-cookies` est un
composant client (il lit et écrit le consentement dans `localStorage`), **et un composant client ne
peut pas exporter `metadata`**. La page héritait donc du titre et de la description du layout racine —
soit exactement le même `<title>` que la page d'accueil.

Corrigé par la séparation standard : un composant serveur qui porte les métadonnées, un composant
client qui porte le comportement. Le rendu est identique.

Après correction : **aucun titre dupliqué sur les 23 pages prérendues.**

Les articles gagnent par ailleurs les propriétés que `og:type="article"` implique et qui manquaient —
`publishedTime`, `modifiedTime`, `authors` — toutes issues de colonnes réelles.

---

## 5. Structure HTML

Deux défauts, tous deux du même type : **un élément choisi pour sa taille à l'écran plutôt que pour ce
qu'il signifie.**

**`/studio` n'avait aucun `<h1>`.** La page commençait directement en `<h2>`, et son titre visible —
« KOV / Virtual Studio » — était composé de deux `<p>`. C'est maintenant un `<h1>` avec deux `<span>` :
mêmes classes, mêmes pixels, et le document dit enfin de quoi il parle.

**Les six pages `/legal/*` avaient deux `<h1>` chacune.** Le layout partagé affichait « Informations
légales » en `<h1>`, et chaque document ajoutait le sien pour son vrai sujet (« Conditions générales de
vente », « Confidentialité »…). Le titre du layout devient un `<p>` — même rendu au pixel — et chaque
page conserve un `<h1>` unique : le sien.

**`/login/forgot` et `/login/reset` n'avaient pas de `<h1>`** non plus, pour la même raison. Corrigé.

Aucun texte n'a été ajouté, déplacé ou masqué dans ces trois corrections. Seules les balises changent.

---

## 6. Sitemap / Robots

**Le sitemap était figé au build.** Comme `/journal` et le hero de l'accueil avant lui : un article
publié depuis l'admin n'y apparaissait pas avant le déploiement suivant. Il a maintenant
`revalidate = 3600`, et les actions de publication appellent `revalidatePath("/sitemap.xml")` — le cas
instantané et le cas « publié directement dans Supabase » sont couverts tous les deux.

**Il ignorait six pages réelles.** Les six routes `/legal/*` sont indexables et liées depuis le footer
de chaque page du site, mais absentes du sitemap. Ajoutées en priorité 0.3.

**Il avalait son erreur Supabase.** `const { data }` seul : une requête en échec était indiscernable de
« aucun article publié », et le résultat était un sitemap livré sans un seul article, en silence.
Journalisé maintenant.

`lastmod` est délibérément posé **uniquement** sur les articles, depuis leur vraie colonne
`updated_at`. Estampiller les routes statiques avec la date du build dirait à Google que tout le site a
changé à chaque déploiement — et un `lastmod` jamais exact est un `lastmod` que Google apprend à
ignorer.

Résultat : **19 URLs, toutes indexables, aucune en `noindex`.** Un sitemap est une liste de pages qu'on
veut voir indexées ; y lister une page en `noindex` est une contradiction que Search Console renvoie
en erreur.

---

## 7. Structured Data

Déjà en bon état et **laissé volontairement incomplet sur un point** (voir §14).

| Schema | Page | État |
|---|---|---|
| `Organization`, `WebSite` | sitewide | existant |
| `FAQPage` (51 Q/R réelles) | `/faq` | existant |
| `Service` | `/expertise/[slug]` | existant |
| `BlogPosting` + `BreadcrumbList` | `/journal/[slug]` | existant, **complété** |

Ajouté sur `BlogPosting` : `dateModified` (Google s'en sert pour juger la fraîcheur d'une page, et la
colonne existait déjà) et `publisher` avec le logo.

**Rien n'a été inventé.** Pas de `SearchAction` sur `WebSite` — la recherche du site est un index flou
côté client, pas une URL interrogeable ; en revendiquer une serait un mensonge fonctionnel adressé aux
crawlers. Pas d'`aggregateRating`, pas de `Review`, pas de `Person`, pas de prix.

---

## 8. Internal Linking

**Zéro lien cassé.** Chaque `href` interne du code a été résolu contre l'arborescence réelle des
routes : le seul non-résolu était `/api/auth/microsoft/connect`, qui est une vraie route API.

Aucune page orpheline dans le périmètre public : nav (4 entrées + logo + contact), footer (4 groupes +
5 liens légaux), et maintenant la page 404 qui propose quatre vraies destinations plutôt que de stopper
le parcours.

**Aucun lien interne n'a été ajouté artificiellement.** Le maillage existant est cohérent ; en
fabriquer davantage pour le SEO aurait été précisément ce que l'énoncé interdit.

---

## 9. Core Web Vitals

Traité en profondeur dans l'audit précédent — voir `PERFORMANCE_AUDIT.md`, commit `379cb15` : socle JS
partagé 720 → 590 Ko, `/legal` 1 444 → 598 Ko, et une vidéo de 7 Mo qui ne part plus au chargement de
l'accueil. Rien n'a été ajouté ici qui coûte quoi que ce soit au runtime : la carte sociale est générée
au build, les corrections de balises sont neutres, et la suppression d'`icon.png` retire 335 Ko.

**LCP, INP et CLS : non mesurés.** Aucun navigateur n'est lancé sur ce projet, et le serveur MCP
Playwright refuse la connexion.

---

## 10. Mobile

`viewport` géré par Next (défaut correct, aucun `maximum-scale` ni `user-scalable=no` — donc le zoom
n'est bloqué nulle part). `lang="fr"` présent. Pas de défilement horizontal : `overflow-x: clip` est
posé sur `html, body` avec une justification écrite.

La navigation mobile, les cibles tactiles et les textes ont été traités dans `UX_UI_AUDIT.md` (commit
`f137a98`) : menu mobile rendu fermable et retiré de l'ordre de tabulation quand il est invisible,
cibles portées à 44 px, clavier numérique sur le champ téléphone.

**Les tests responsive réels n'ont pas pu être exécutés** — pas de navigateur.

---

## 11. Images

`next/image` émet désormais AVIF en plus de WebP (audit précédent). La couverture d'article — élément
LCP de chaque article — est passée de `<img>` brut à `next/image`, avec une garde : `remotePatterns`
n'a **pas** été élargi, parce qu'un optimiseur d'images ouvert vaut plus à un attaquant que
l'optimisation ne nous vaut.

**Alt text :** audité sur les composants publics. 15 `alt=""` (images décoratives — correct, c'est ce
que la spec demande), 3 `alt="KOV"` (le wordmark), et deux alt descriptifs réels sur les deux visuels
porteurs d'information. **Aucun bourrage de mots-clés, et rien à corriger.**

---

## 12. Pages / URLs

Les slugs sont déjà propres et lisibles : `/expertise/sites-immersifs`, `/legal/gestion-cookies`,
`/journal/[slug]`. Aucun identifiant technique, aucun paramètre, aucune URL à rallonge.

**Aucune URL n'a été modifiée** — donc aucune redirection à gérer. Les trois redirections permanentes
existantes (`/cgv`, `/terms`, `/privacy` → `/legal/*`) sont des sauts uniques, sans chaîne ni boucle.

`www` / apex, HTTPS et trailing slash : gérés par Vercel et par le défaut Next (pas de trailing slash).
Non modifiés — voir §14 pour la seule vérification à faire côté DNS.

---

## 13. Corrections réalisées

| Page | Problème | Correction | Impact attendu |
|---|---|---|---|
| Toutes | Aucune page 404 : Next servait sa page par défaut, hors DA, sans retour possible | `not-found.tsx` aux couleurs du site, `noindex, follow`, 2 CTA + 4 destinations réelles | Le visiteur perdu reste sur le site ; le crawler repart vers des pages réelles |
| Toutes | `og:image` en 1116×209 : aperçu de lien cassé sur toutes les plateformes | `opengraph-image.tsx` — 1200×630 généré au build, wordmark réel embarqué, tagline existante | Les partages affichent enfin une vraie carte ; `twitter:image` suit automatiquement |
| Toutes | `icon.png` en 1448×1086, doublon exact d'un asset brand, 335 Ko | Supprimé ; `favicon.ico` (16/32/48/256) reste la seule source | Favicon net partout, 335 Ko de moins au déploiement |
| `/login` | `Disallow` + lié depuis le footer → indexation en URL nue possible | Retiré du `Disallow`, `robots: { index: false, follow: true }` | L'instruction est enfin lisible par Google |
| `/merci` | Entièrement indexable ; concurrence `/contact` sur la même intention | `noindex, follow` | Plus de confirmation de formulaire dans les résultats |
| `/login/forgot`, `/login/reset` | Entièrement indexables | `noindex, nofollow` + un vrai `<h1>` | Les parcours mot de passe sortent de l'index |
| `/journal/preview/[id]` | Ni `Disallow` ni `noindex` (mais `requireAdmin`) | Les deux | Second verrou sur les brouillons |
| `/api/*` | Absent du `Disallow` | Ajouté | Budget de crawl non gaspillé |
| `/legal/gestion-cookies` | Composant client → pas de `metadata` → titre dupliqué avec l'accueil | Séparé serveur/client ; titre, description et canonical propres | Dernier titre dupliqué éliminé |
| `/studio` | Aucun `<h1>` ; le titre visible était deux `<p>` choisis pour leur taille | `<h1>` + `<span>`, mêmes classes | La page déclare son sujet, sans un mot ajouté |
| `/legal/*` (×6) | Deux `<h1>` par page : celui du layout et celui du document | Le titre du layout devient `<p>` | Un `<h1>` par page, celui du vrai sujet |
| `/sitemap.xml` | Figé au build ; 6 pages légales absentes ; erreur Supabase avalée | `revalidate = 3600` + `revalidatePath` ; routes légales ajoutées ; erreur journalisée | Les articles apparaissent sans redéploiement ; 19 URLs |
| `/journal/[slug]` | `BlogPosting` sans `dateModified` ni `publisher` ; OG sans dates ni auteur | Ajoutés, depuis des colonnes réelles | Signal de fraîcheur, éligibilité aux rich results |

---

## 14. Actions manuelles

Ces points ne peuvent pas être faits depuis le code, ou relèvent d'une décision qui t'appartient.

**1. Google Search Console — aucune vérification n'existe dans le projet.**
Je n'en ai pas fabriqué. À faire :
1. [search.google.com/search-console](https://search.google.com/search-console) → *Ajouter une
   propriété* → **Préfixe d'URL** : `https://kov-agency.site`.
2. Choisir la vérification **par balise HTML**, copier le contenu de la balise.
3. Me donner cette valeur : je l'ajoute proprement via `verification.google` dans le layout racine
   (Next a un champ dédié, pas besoin de coller une balise à la main).
4. Soumettre `https://kov-agency.site/sitemap.xml` dans *Sitemaps*.

Alternative sans code : vérification par enregistrement DNS TXT chez ton registrar — elle couvre le
domaine entier, sous-domaines compris.

**2. Bing Webmaster Tools** — import direct depuis Search Console une fois celle-ci active. Cinq
minutes, et ça couvre aussi ChatGPT Search, qui s'appuie sur l'index Bing.

**3. L'adresse dans les données structurées — ta décision.**
L'adresse réelle et le SIRET existent, sont vérifiés au registre, et sont **déjà publiés sur `/legal`**
parce que la loi l'exige. Les ajouter au `Organization` JSON-LD renforcerait le référencement local.
**Je ne l'ai pas fait :** KOV est une entreprise individuelle, donc cette adresse est une adresse
personnelle, et la diffuser en données structurées sur chaque page du site est un choix qui t'appartient,
pas un défaut technique à corriger. Dis-moi et je le fais en une ligne.

**4. Google Business Profile.** Sans fiche, aucune donnée structurée ne fera apparaître KOV dans le
pack local ou sur Maps. Même arbitrage que le point 3 : une fiche demande une adresse (elle peut être
masquée publiquement, avec une zone de chalandise à la place — c'est l'option adaptée à un studio qui
travaille surtout à distance, comme la FAQ le dit elle-même).

**5. Les liens sociaux du footer pointent tous vers `/contact`.** Déjà signalé dans `UX_UI_AUDIT.md`.
Côté SEO, cela empêche aussi de déclarer `sameAs` dans le `Organization` schema — le signal standard
qui relie un site à ses profils officiels. Dès que les vraies URL existent : les deux se règlent
ensemble.

**6. Vérifier la redirection `www` → apex** dans Vercel (Settings → Domains). Un domaine servi sur les
deux sans redirection est du contenu dupliqué. Cela ne se vérifie pas depuis le dépôt.

**7. Les backlinks** — voir `BACKLINK_OPPORTUNITIES.md`.

---

## 15. Mesures

**Mesuré réellement, depuis le build :**

| | Avant | Après |
|---|---|---|
| Pages prérendues avec exactement un `<h1>` | 13 / 16 | **16 / 16** |
| Titres `<title>` dupliqués | 1 | **0** |
| Pages publiques sans description | 1 | **0** |
| URLs dans le sitemap | 13 | **19** |
| URLs en `noindex` listées dans le sitemap | 0 | 0 |
| Pages privées / utilitaires indexables | 3 | **0** |
| Liens internes cassés (51 routes) | 0 | 0 |
| `og:image` | 1116 × 209 | **1200 × 630** |
| Favicon déclaré | 1448 × 1086 (+ `.ico`) | **`.ico` 16/32/48/256** |
| Texte réel dans le HTML sans JS | `/` 7 519 car. · `/faq` 12 309 car. | inchangé |

**Non mesuré :** LCP, INP, CLS, et les quatre scores Lighthouse. Aucun navigateur n'est lancé sur ce
projet — c'est la règle permanente ici — et le serveur MCP Playwright refuse la connexion
(`CONNECT_TIMEOUT`). L'audit Lighthouse demandé en §26 **n'a pas pu être exécuté**, et aucun score n'est
avancé à sa place. Il devra être lancé sur le site déployé.

**Vérification du build :** `npx tsc --noEmit` propre · `npm run lint` au niveau de référence du projet
(3 erreurs, 2 avertissements préexistants, sans rapport) · `npm run build` propre, 59 pages générées.
