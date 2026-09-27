# Pricing KOV — Phase 0 : exploration et plan

> Réponse à `docs/specs/pricing.md` §3. Aucun code écrit. Tout ce qui est
> affirmé ici a été lu dans le dépôt ou calculé, jamais supposé.

---

## 1. Ce qui existe

### 1.1 Stack et routage

| Point | Constat |
|---|---|
| Next.js | **16.3.5**, App Router, React 19.2.8, TypeScript 5, Tailwind v4 |
| Supabase | `@supabase/ssr` 0.12.4, `supabase-js` 2.112.3 |
| Organisation | `src/app/admin/<section>/{page.tsx, actions.ts, *.tsx}` — les Server Actions sont colocalisées avec leur écran, pas centralisées |
| Protection | `src/proxy.ts` (Next 16 a renommé `middleware.ts`) : matcher `/admin`, `/admin/:path*`, `/client`, `/client/:path*`, lecture du rôle via la clé service |
| Deuxième garde | `requireAdmin()` (`src/lib/auth.ts`) re-vérifie le rôle à chaque requête |
| Navigation | `src/lib/admin/navigation.tsx`, sections `overview / commercial / delivery / business / system` |

**Conséquence pour le pricing :** `/admin/pricing/*` est couvert par le matcher existant sans y toucher. Aucune modification de `proxy.ts`.

### 1.2 Le module de devis existant

Table `quotes` (`20260821130000`, étendue par `20260831100000` et `20260913090100`) :

```
id, client_id → profiles, lead_id → leads, project_id → projects, invoice_id → invoices,
reference (unique), recipient_name, recipient_email,
line_items jsonb  -- [{description, quantity, unit_price_cents}]
subtotal_cents, discount_cents, total_cents,
status  -- draft | sent | accepted | declined | expired
valid_until, pdf_storage_path, sent_at,
yousign_request_id, yousign_signer_id, signing_url, signed_at, signed_pdf_storage_path
```

- **Numérotation : déjà résolue.** Trigger `assign_document_reference('quote','D')` en `BEFORE INSERT` → `D-2026-001`. Une référence fournie est respectée. Le module de pricing devra donc insérer `reference: null` et **lire la valeur attribuée** dans le `RETURNING`, jamais en proposer une.
- **Totaux :** calculés dans `createQuote` à partir des lignes, en centimes entiers. RLS activée, **zéro policy** : toute lecture passe par `supabaseAdmin`.
- **TVA : il n'y a aucune colonne de TVA, nulle part.** Le PDF affiche `business_settings.vat_mention`, dont la valeur réelle en base est aujourd'hui `TVA non applicable, art. 293 B du CGI`. KOV est en franchise en base : le devis n'a jamais eu à porter un taux.
- **PDF :** `@react-pdf/renderer`, `src/lib/billing/QuoteDocument.tsx`, généré **après** l'insertion (il doit connaître son propre numéro), déposé dans le bucket privé à `quotes/{id}.pdf`.
- **Envoi** `sendQuoteEmail`, **signature** Yousign (`requestQuoteSignature` + webhook), **conversion** `convertQuoteToInvoice`.

**Le point de contact technique :** `createQuote` ne prend qu'un `FormData`. Il n'existe aucune porte d'entrée programmatique. Le dépôt a déjà résolu ce cas ailleurs (`createProjectRow` / `createProject`) : on extrait le cœur, la fonction `FormData` devient une enveloppe. C'est une extension, pas une réécriture.

### 1.3 L'identité du client — le trou

`profiles` : `id, role, full_name, company, email, phone, account_manager_id, display_title, avatar_path, is_online, created_at, updated_at`.

**Pas d'adresse. Pas de SIREN. Pas de numéro de TVA.** `leads` a trente colonnes et n'en a pas davantage. Le PDF de devis n'imprime aujourd'hui que le nom et l'email du destinataire.

Cela bloque deux exigences de la spec §4.4 : « identité et adresse du client », et la vérification que le futur passage devis → facture disposera du SIREN, de l'adresse et de la catégorie d'opération. La facturation électronique est obligatoire en réception depuis le 1er septembre 2026 ; ces champs ne sont pas un confort.

### 1.4 Les tests

**Il n'existe aucun test dans ce dépôt.** Pas de script `test`, pas de Vitest, pas de Jest, zéro fichier `*.test.*`.

Mesuré plutôt que supposé : **Node 24.15 exécute `node --test` directement sur du TypeScript**, grâce au retrait natif des types. Sonde écrite et lancée, elle passe. Zéro dépendance à ajouter.

Une contrainte en découle, et elle doit être écrite avant de coder : `node --test` ne résout **ni l'alias `@/` ni les imports sans extension**. Les fichiers de `src/lib/pricing/` devront donc s'importer entre eux en **relatif avec l'extension `.ts` explicite**. Les écrans continuent d'utiliser `@/` normalement. C'est précisément la séparation que la spec demande (« fonctions pures, séparées de l'UI et de la base ») : le moteur ne peut plus importer l'application, même par accident.

### 1.5 Les composants réutilisables

Tout ce dont le configurateur a besoin existe déjà : `Modal`, `Field` / `Input` / `Textarea`, `fieldStyles` (`FIELD_CLASS`, `FIELD_STYLE`, `FIELD_LABEL`), `Select` (maison, portalise sa liste), `GlassCard`, `Button`, `Chip`, `StatCard`, `StatusBadge`, `ProgressBar`, `EmptyState` / `ErrorState` / `LoadingState`, `ConfirmDialog`, `sonner` monté dans `AdminProviders`, TanStack Query disponible sur tout l'admin.

**Aucune librairie à installer.** `tabular-nums` est déjà la convention pour les montants.

---

## 2. Le calibrage : ce que la grille dit vraiment

La spec demande (§7.1) que chaque offre par défaut, aux paramètres 2027, tombe à moins de 10 % de son prix de référence. J'ai appliqué les formules de §4.2 aux compositions de §5.2 avant d'écrire une ligne de moteur.

**Les trois valeurs que la spec annonce elle-même sont reproduites exactement** : coût/jour 2027 = 300,66 € (annoncé « environ 301 »), coût/jour 2028 = 426,92 € (annoncé « environ 427 »), cas limite du business plan = −3 473 € (annoncé « environ −3 500 »). Les formules sont donc lues correctement.

### Paramètres 2027 — micro-entreprise, coût de revient 301 €/jour

| Offre | Jours | Prix calculé | Référence | Écart | TJM implicite | Marge |
|---|---|---|---|---|---|---|
| Landing page | 5,5 | 2 850 € | 2 800 € | +1,8 % | 500 € | 38,5 % |
| Site vitrine | 16,0 | 7 200 € | 7 000 € | +2,9 % | 431 € | 29,0 % |
| Site avancé | 29,0 | 13 750 € | 13 500 € | +1,9 % | 433 € | 27,9 % |
| Outil métier | 36,0 | 16 500 € | 16 000 € | +3,1 % | 442 € | 30,8 % |
| Module 3D | 10,0 | 4 900 € | 4 500 € | **+8,9 %** | 450 € | 30,5 % |
| Audit | 3,0 | 1 500 € | 1 500 € | 0,0 % | 500 € | 39,9 % |

**Les six passent.** Mais le module 3D n'a que 1,1 point de marge sous le seuil : modifier le taux MOTION de 10 € casserait le test. À signaler dans le test lui-même plutôt qu'à découvrir dans six mois.

### Paramètres 2028 — société à l'IS, coût de revient 427 €/jour, indexation +5 %

| Offre | Prix | TJM implicite | Marge € | Marge % | |
|---|---|---|---|---|---|
| Landing page | 2 950 € | 518 € | 502 € | 17,0 % | |
| Site vitrine | 7 500 € | 450 € | **369 €** | **4,9 %** | avertissement |
| Site avancé | 14 400 € | 455 € | **819 €** | **5,7 %** | avertissement |
| Outil métier | 17 300 € | 464 € | **1 331 €** | **7,7 %** | avertissement |
| Module 3D | 5 100 € | 470 € | **431 €** | **8,4 %** | avertissement |
| Audit | 1 550 € | 517 € | 269 € | 17,4 % | |

**Voilà le résultat qui compte.** Le passage en société multiplie le coût de revient par 1,42 ; l'indexation prévue le compense à hauteur de 1,05. Quatre offres sur six passent sous la marge cible de 15 %, et le site vitrine — l'offre centrale — descend à 4,9 %, soit 369 € de marge pour seize jours de travail.

Ce n'est pas un défaut du moteur : c'est ce que la grille dit, et c'est exactement ce que l'outil est fait pour rendre visible. J'ai calculé l'indexation qui rétablirait 15 % partout :

| Offre | Indexation 2028 nécessaire |
|---|---|
| Landing page | +2,5 % |
| Audit | +3,7 % |
| Module 3D | +13,7 % |
| Outil métier | +14,5 % |
| Site vitrine | **+17,8 %** |
| Site avancé | **+17,9 %** |

Les deux petites offres tiennent grâce à la majoration « petit projet » de 15 %, qui joue ici son rôle. **Les trois offres qui portent le chiffre d'affaires demandent entre 14 et 18 %, pas 5 %.**

Je ne change rien : la spec dit « le test signale sans modifier les taux », et le paramètre d'indexation reste éditable en §4.5. Le moteur affichera le chiffre ; la décision est commerciale.

**Une conséquence de schéma, en revanche :** si les taux s'indexent et que les prix de référence restent figés à 2027, l'alerte « composition par défaut à plus de 10 % de la grille » se déclenchera sur toutes les offres dès 2028 — le module 3D est déjà à +13,3 %. Les prix de référence et les bandes de marché doivent donc être **datés comme les taux**, pas stockés une fois pour toutes.

---

## 3. Schéma proposé

Treize tables, toutes préfixées `pricing_`, toutes en RLS sans policy (lecture par `supabaseAdmin`, convention établie du dépôt depuis `quotes` et `business_settings`).

### Référentiel — ce qui se paramètre

| Table | Contenu | Lien |
|---|---|---|
| `pricing_settings_versions` | année, régime (`micro` / `is`), rémunération cible, taux de cotisations, charges fixes, amortissements, jours facturables, coefficients, TJM plancher, marge cible, indexation, TVA + date d'effet | racine de toute version |
| `pricing_roles` | code, libellé, taux de vente, coût freelance, `internal_only`, `default_subcontracted` | `settings_version_id` |
| `pricing_offers` | clé, libellé, prix de référence, coûts externes, délai, échéancier par défaut (jsonb) | `settings_version_id` |
| `pricing_modules` | clé, libellé, round (R0–R7), unité de quantité, coûts externes, facultatif, dépendances, incompatibilités | `settings_version_id` |
| `pricing_module_role_days` | jours `numeric(6,2)` par rôle | `module_id` + `role_code` |
| `pricing_offer_default_modules` | composition par défaut d'une offre, quantité par défaut | `offer_id` + `module_id` |
| `pricing_subscriptions` | formule, prix mensuel, jours mensuels, externes mensuels, engagement minimal | `settings_version_id` |
| `pricing_market_bands` | bande freelance / agence / premium par offre | `offer_id` |
| `pricing_market_benchmarks` | libellé, valeur, unité, séniorité, zone, source, URL, date de consultation, nature | autonome |
| `pricing_text_templates` | inclus / non inclus / hypothèses / description de module | clé |

`archived_at` partout, **jamais de suppression physique** : la spec l'exige pour les modules déjà utilisés, et la même règle appliquée partout évite d'avoir à se demander laquelle des deux s'applique.

### Production — ce qui se chiffre

| Table | Contenu |
|---|---|
| `pricing_configurations` | client ou lead, offre, `settings_version_id`, `selection jsonb`, `conditions jsonb`, `snapshot jsonb`, statut, version, `quote_id`, dérogation (motif + auteur + horodatage) |
| `pricing_actuals` | jours réellement consommés, par configuration et par rôle |

**Pourquoi `selection` en jsonb et non une table fille.** Une sélection se lit et s'écrit d'un bloc, jamais module par module, et elle doit pouvoir être rejouée telle quelle. Une table fille inviterait des jointures qui divergeraient du `snapshot`. La seule requête transversale utile — « quelles configurations utilisent le module X ? », nécessaire avant d'archiver un module — se fait par conteneur jsonb avec un index GIN.

**Le `snapshot` est ce qui rend le prix explicable un an plus tard :** taux appliqués, coût de revient retenu, version des références, résultat ligne par ligne. Sans lui, changer un taux réécrirait l'histoire de tous les devis passés.

### Ce que je ne touche pas

**Aucune colonne ajoutée à `quotes`.** Le lien se fait dans un seul sens, `pricing_configurations.quote_id`, avec un index unique partiel. Le PDF remonte à la configuration par une lecture inverse. Deux pointeurs qui peuvent se contredire valent moins qu'un seul.

### Une migration additive sur `profiles`

`address_street, address_postal_code, address_city, address_country, siren, vat_number` — toutes nullables. Plus l'extension du `grant update` mis en place par `20260925100000`, pour que le client tienne à jour sa propre adresse de facturation comme il tient son téléphone. C'est le minimum pour un devis conforme, et c'est aussi ce que la facturation électronique exigera.

---

## 4. Stratégie de mapping : configuration → lignes de devis

C'est le point que la spec demande explicitement, et c'est là que se cache la seule vraie difficulté arithmétique.

**Le problème.** Le prix HT est arrondi à 50 € **au niveau du projet**, après majorations. Les lignes, elles, sont calculées avant. Recalculer un prix par ligne donnerait une somme qui ne tombe pas sur le total. Or `createQuote` recalcule `subtotal = Σ quantité × prix unitaire` : si les lignes ne somment pas juste, le devis affiche un total différent du prix annoncé dans le configurateur.

**La solution : on alloue, on ne recalcule pas.**

```
prix_avant_remise = arrondi50(sous_total × majorations)
prix_HT           = arrondi50(sous_total × majorations × (1 − remise))

lignes            : réparties au prorata du prix brut de chaque ligne,
                    arrondies au centime ; la ligne la plus grosse absorbe
                    le résidu (quelques centimes) et porte donc quantité 1
subtotal_cents    = prix_avant_remise        (garanti par l'absorption)
discount_cents    = prix_avant_remise − prix_HT
total_cents       = prix_HT                  (exact, par construction)
```

L'identité `subtotal − discount = total` tient au centime. Sans remise, `discount` vaut exactement zéro : pas de remise fantôme née d'un arrondi.

**Deux modes d'affichage** (spec §4.1.5), même allocation :

- **Forfait par round** : une ligne par round (R0 Cadrage, R1 Architecture, …), description construite à partir des modules qu'il contient, quantité 1.
- **Détail par module** : une ligne par module, quantité réelle (pages, langues, écrans), prix unitaire = prix de ligne ÷ quantité.

**Les options facultatives ne passent pas dans `line_items`.** Elles seraient totalisées par `createQuote` et gonfleraient le devis. Elles vivent dans le `snapshot` et s'impriment dans un bloc distinct du PDF, sous la mention « proposé en option, non inclus dans le total ».

**Le rapprochement avec les phases du projet.** Les rounds R0–R7 de la spec recouvrent presque exactement les sept phases KOV déjà publiées sur le site et déjà écrites dans `project_phases` (`src/lib/process/phases.ts`) :

| Round | Phase KOV |
|---|---|
| R0 Cadrage | Découvrir |
| R1 Architecture | Structurer |
| R2 Direction créative + R3 Design | Designer |
| R4 Build | Développer |
| R5 Motion et polish | Animer |
| R6 QA et lancement | Lancer |
| R7 Evolve | Évoluer |

Huit rounds pour sept phases : R2 et R3 se rejoignent. Les deux granularités restent distinctes — le round sert à chiffrer, la phase à montrer au client — mais la correspondance est stockée, ce qui permettra à un devis signé de pré-remplir les phases du projet avec les bonnes dates. C'est ce qui ferme la boucle « vendu contre consommé » de §4.7.

---

## 5. Risques

1. **Le module 3D est à 1,1 point du seuil de calibrage** (+8,9 % pour 10 % autorisés), et il le dépasse déjà aux paramètres 2028 (+13,3 %). Le test doit nommer la marge restante, pas seulement passer ou échouer.
2. **Les prix de référence ne sont pas datés dans la spec.** S'ils restent figés pendant que les taux s'indexent, l'alerte d'écart à la grille se déclenchera partout dès 2028. Je les rattache à `settings_version_id`.
3. **Le taux TNS de 45 % est donné comme « ordre de grandeur à confirmer »** par la spec elle-même. Il pilote le coût de revient 2028, donc toutes les alertes bloquantes de cette année-là. Il sera stocké comme paramètre, et l'écran de réglages portera la mention « à confirmer avec l'expert-comptable » tant que personne ne l'aura validée. Aucun autre chiffre ne sera présenté comme acquis s'il ne l'est pas.
4. **La TVA est un futur, pas un présent.** KOV est en franchise ; le seuil de 37 500 € se franchit en un seul bon trimestre. Le moteur calcule la TVA dès maintenant, mais la mention de franchise reste ce que le PDF imprime tant que le paramètre daté n'a pas changé.
5. **`createQuote` devra être scindé** en cœur programmatique et enveloppe `FormData`. Comportement identique, mais c'est la seule modification du module existant. Le dépôt a déjà fait exactement ça pour les projets.
6. **Le webhook Yousign n'a jamais vu de livraison réelle** — son propre en-tête le concède. Un devis issu du pricing suit le même chemin ; ce risque n'est ni aggravé ni corrigé ici.
7. **Rien ne sera vu à l'écran.** Aucun navigateur ne tourne sur ce projet. Le configurateur est l'écran le plus dense de l'admin : sa densité réelle devra être jugée par vous.

## 6. Questions

Aucune ne bloque les phases 1 et 2, qui sont du schéma et du calcul. Elles portent toutes sur la phase 5.

1. **L'adresse du client sur le devis** — j'ajoute les colonnes, mais les deux clients existants n'ont pas d'adresse en base. Le PDF imprime-t-il le bloc sans adresse, ou refuse-t-il de générer tant qu'elle manque ? Par défaut je l'imprime sans, et je signale le manque dans l'écran.
2. **Le taux TNS de 45 %** — le laisse-t-on tel quel avec sa mention d'incertitude, ou attend-on l'expert-comptable avant de le figer ?
3. **Les devis destinés à des particuliers** (spec §4.4) — KOV en a-t-il ? Si oui, il manque le droit de rétractation de quatorze jours et les mentions du code de la consommation. Je ne les écrirai pas sans confirmation.

---

## 7. Fichiers

**Créés**

```
supabase/migrations/2026MMDD_create_pricing_module.sql      schéma + RLS
supabase/migrations/2026MMDD_seed_pricing_catalog.sql       rôles, offres, modules, abonnements
supabase/migrations/2026MMDD_seed_pricing_benchmarks.sql    références de marché datées
supabase/migrations/2026MMDD_profiles_billing_identity.sql  adresse + SIREN

src/lib/pricing/types.ts          formes partagées
src/lib/pricing/money.ts          centimes, arrondi à 50, allocation au prorata
src/lib/pricing/costOfSale.ts     coût de revient par régime
src/lib/pricing/engine.ts         lignes, majorations, prix HT, marge, TJM
src/lib/pricing/vat.ts            TVA datée, franchise
src/lib/pricing/schedule.ts       échéancier, résidu sur la dernière échéance
src/lib/pricing/alerts.ts         les douze règles de §4.3
src/lib/pricing/quoteMapping.ts   configuration → lignes de devis
src/lib/pricing/*.test.ts         les dix tests de §7

src/lib/pricing/catalog.ts        lectures Supabase (server-only, hors moteur)
src/app/admin/pricing/…           configurateur, historique, réglages
src/components/admin/pricing/…    récapitulatif, alertes, sélecteur de modules
```

**Modifiés**

```
src/app/admin/quotes/actions.ts   extraction de createQuoteRecord
src/lib/billing/QuoteDocument.tsx bloc pricing optionnel (échéancier, TVA, inclus / non inclus)
src/lib/admin/navigation.tsx      entrée « Pricing » dans la section Commercial
package.json                      script "test": "node --test"
```

---

## 8. Ordre d'exécution

Inchangé par rapport à §9 de la spec. Phase 1 schéma et seed, phase 2 moteur et tests, phase 3 réglages, phase 4 configurateur, phase 5 génération du devis, phase 6 historique et réel consommé. Arrêt et résumé à chaque fin de phase.
