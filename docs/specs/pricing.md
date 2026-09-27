# Prompt Claude Code : module Pricing KOV Studio

> **Mode d'emploi (pour Mattéo, à ne pas coller).** Enregistre ce fichier dans le dépôt, par exemple `docs/specs/pricing.md`. Lance Claude Code à la racine du projet, en mode plan, avec ce message : « Lis `docs/specs/pricing.md` et exécute uniquement la phase 0. » Valide le plan avant de le laisser coder. Les phases suivantes se lancent une par une.

---

## 1. Contexte

Tu travailles sur l'application interne de **KOV Studio**, studio digital basé à Bordeaux (sites premium, outils métier sur mesure, motion et 3D, maintenance). Stack attendue : Next.js, TypeScript, Supabase (PostgreSQL, Auth, RLS), déploiement Vercel. Vérifie la stack réelle dans le dépôt avant toute hypothèse.

L'application possède déjà un **espace admin avec génération de devis**. Ta mission est d'ajouter un **module de pricing dédié** : un configurateur où je coche des offres et des modules, qui calcule un prix justifié par le temps de production et confronté au marché, puis qui **génère un devis dans le système de devis existant** à partir des cases cochées.

Principe non négociable : un prix KOV n'est jamais saisi à la main ni fixé pour « faire joli ». Il résulte de jours de production par rôle multipliés par des taux, de coûts externes, de coefficients explicites, puis il est contrôlé contre le coût de revient de KOV et contre des références de marché datées. Chaque prix doit pouvoir être expliqué ligne par ligne.

## 2. Règles de travail

- **Phase 0 obligatoire, sans écrire de code** : explore le dépôt puis rends un plan écrit. Attends ma validation.
- Ne modifie pas le comportement du générateur de devis existant. Tu l'appelles, tu l'étends si nécessaire, tu ne le réécris pas.
- Aucune migration destructive (pas de `DROP`, pas de renommage de table ou de colonne existante). Nouvelles tables préfixées `pricing_`.
- Migrations Supabase versionnées dans le dossier existant. Ne les applique jamais sur l'environnement de production sans me le demander.
- Montants stockés en **centimes entiers** (`integer` ou `bigint`), jamais en flottant. Jours stockés en `numeric(6,2)`.
- Toute la logique de calcul vit dans des **fonctions pures TypeScript** testées, séparées de l'UI et de la base.
- Réutilise le design system, les composants et les conventions déjà présents dans l'admin. N'ajoute pas de librairie UI si une solution existe dans le projet.
- Après chaque phase : typecheck, lint, tests, puis un résumé de ce qui a été fait et de ce qui reste. Un commit par étape cohérente.
- Si une information manque (identité légale, numérotation, format PDF), pose la question au lieu d'inventer.

## 3. Phase 0 : exploration et plan

Identifie et documente :

1. Version de Next.js, type de routing, organisation des dossiers, gestion de l'authentification et protection des routes admin.
2. Le module de devis existant : tables, colonnes, statuts, numérotation, calcul des totaux, gestion de la TVA, génération PDF, envoi éventuel, signature éventuelle.
3. Les tables clients existantes et les champs disponibles (raison sociale, adresse, SIREN).
4. Le framework de test en place (ou son absence) et les scripts `package.json`.
5. Les composants UI réutilisables (formulaires, cases à cocher, tableaux, toasts, modales).

Livre ensuite un plan qui contient : le schéma des nouvelles tables et leur lien avec les tables existantes, la liste des fichiers créés ou modifiés, la stratégie de mapping « sélection de pricing vers lignes de devis », les risques identifiés et tes questions.

## 4. Périmètre fonctionnel

### 4.1 Configurateur (`/admin/pricing/new`, adapte au routing existant)

Parcours en une page, organisé en sections repliables, avec un panneau récapitulatif collé à droite (barre fixe en bas sur mobile).

1. **Client et contexte** : client existant ou nouveau ; segment (cabinet financier ou CGP, cabinet de conseil, profession libérale, PME B2B, startup, autre) ; régime de TVA du client (assujetti, récupération partielle, non assujetti) ; complexité ; urgence ; année tarifaire.
2. **Offre de base** (choix unique) : landing page premium, site vitrine premium, site premium avancé, outil métier ou espace client, module immersif 3D, audit, ou « sur mesure » (aucun module pré-coché).
3. **Modules à cocher**, groupés par round de production (R0 à R7, voir 4.6). Le choix d'une offre pré-coche sa composition par défaut. Chaque module affiche ses jours par rôle, une quantité si pertinente (pages, langues, écrans, intégrations), ses dépendances et ses incompatibilités.
4. **Abonnement** : aucun, Essentiel, Évolution, Support outil métier.
5. **Conditions** : échéancier (proposé automatiquement selon l'offre, modifiable), durée de validité, délai d'exécution, remise éventuelle avec motif obligatoire, mode d'affichage client (forfait par round, ou détail en jours).
6. **Options facultatives** : modules non retenus que je veux proposer au client en option, affichés sur le devis sans être totalisés.

Le panneau récapitulatif se met à jour en temps réel : prix HT et TTC, jours par rôle, part sous-traitée, coût de production, marge projet en euros et en pourcentage, TJM implicite, positionnement sur la bande de marché de l'offre, et liste des alertes.

### 4.2 Moteur de calcul (`lib/pricing/`, fonctions pures)

Pour chaque module sélectionné, avec sa quantité :

```
jours_role        = jours_module_role × quantité × coef_complexité
prix_ligne        = Σ(jours_role × taux_vente_role) + coûts_externes × (1 + majoration_externes)
coût_ligne        = Σ(jours_role × coût_role) + coûts_externes
                    où coût_role = coût de revient KOV si le rôle est produit en interne,
                    coût freelance du rôle s'il est coché « sous-traité »
```

Puis au niveau du projet :

```
sous_total        = Σ prix_ligne
majoration_petit  = +15 % si le total des jours < 8 (frais fixes de cadrage, d'échanges et d'administration)
majoration_urgence= +0 % (normal), +15 % (délai réduit de 25 %), +30 % (délai réduit de 40 %)
remise            = 0 à 10 % maximum, motif obligatoire, refusée au-delà
prix_HT           = arrondi à 50 € près de (sous_total × (1 + majorations) × (1 - remise))
marge_projet      = prix_HT - coûts_externes - Σ(jours × coût_role)
TJM_implicite     = (prix_HT - coûts_externes) / Σ jours
```

**Coût de revient journalier : calculé, jamais saisi.** Il dépend du régime de l'année tarifaire, à partir des paramètres :

```
Société à l'IS (gérant TNS) :
  coût_jour = (rémunération_nette_cible × (1 + taux_cotisations_TNS) + charges_fixes + amortissements) / jours_facturables

Micro-entreprise (cotisations assises sur le CA) :
  coût_jour = (revenu_net_cible + charges_fixes + amortissements) / (jours_facturables × (1 - taux_cotisations_micro))
```

Valeurs de départ (issues du business plan KOV de septembre 2026) :

| Année | Régime | Revenu ou rémunération nette cible | Taux cotisations | Charges fixes | Amortissements | Jours facturables | Coût jour obtenu |
|---|---|---|---|---|---|---|---|
| 2027 | Micro-entreprise | 18 000 € | 25,8 % du CA | 8 440 € | 1 000 € | 123 | environ 301 € |
| 2028 | Société à l'IS | 26 400 € | 45 % de la rémunération | 15 720 € | 1 500 € | 130 | environ 427 € |

Le taux micro de 25,8 % correspond au taux BNC du régime général de 25,6 % en vigueur depuis le 1er janvier 2026, plus 0,2 % de contribution à la formation. Le taux TNS de 45 % est un ordre de grandeur à confirmer avec l'expert-comptable.

**Abonnements** : calcul séparé du projet (prix mensuel, valeur annuelle, jours mensuels, marge mensuelle). Engagement minimal de 12 mois pour Évolution et Support.

**Échéancier** : généré à partir de l'offre et relié aux rounds.

| Offre | Échéancier par défaut |
|---|---|
| Landing page, module 3D, audit | 50 % à la commande, 50 % à la livraison |
| Site vitrine premium, site premium avancé | 40 % à la commande, 30 % à la validation du design (R3), 30 % à la recette (R6) |
| Outil métier | 30 % à la commande, 25 % à la validation des maquettes, 25 % à la version de recette, 20 % à la mise en production |

La somme des échéances doit être exactement égale au total TTC : le résidu d'arrondi est porté sur la dernière échéance.

**TVA** : paramètre global daté. Si KOV est en franchise en base, TVA à 0 et mention « TVA non applicable, art. 293 B du CGI ». Sinon TVA à 20 %. Seuils de franchise en services pour 2026 : 37 500 €, seuil majoré 41 250 €. Si le client ne récupère pas ou récupère partiellement la TVA, le récapitulatif met le TTC en avant.

### 4.3 Alertes

| Condition | Niveau | Comportement |
|---|---|---|
| Marge projet < 0 | Bloquant | Génération du devis impossible sans dérogation motivée, journalisée |
| Marge projet < 15 % | Avertissement | Affiché dans le récapitulatif |
| TJM implicite < coût de revient journalier | Bloquant | Idem marge négative |
| TJM implicite < TJM plancher paramétré (420 € par défaut) | Avertissement | |
| Taux de vente d'un rôle sous-traité < coût freelance de ce rôle | Avertissement | Message explicite : sous-traiter ce rôle à ce tarif détruit de la marge |
| Jours sous-traités > 40 % du total | Avertissement | |
| Prix sous la bande « freelance » de l'offre | Information | Risque de sous-évaluation |
| Prix au-dessus de la bande « premium » | Information | À justifier par le portfolio |
| Projet > 15 jours sans module R0 | Avertissement | Proposer le cadrage payant |
| Remise > 10 % | Bloquant | Refus |
| Référence de marché de plus de 180 jours | Bandeau | Inviter à mettre les références à jour |
| Composition par défaut d'une offre qui s'écarte de plus de 10 % du prix de référence de la grille | Information | Signaler, ne pas corriger automatiquement les taux |

### 4.4 Génération du devis

À partir d'une configuration validée, un bouton « Générer le devis » crée un devis **dans le module existant** (mêmes tables, même numérotation, même PDF).

- Lignes : une ligne par round avec sous-lignes par module, ou une ligne par module, selon le mode d'affichage choisi. Libellés et descriptions issus des gabarits de texte des modules.
- Options facultatives : section distincte, non totalisée.
- Blocs de texte automatiques : « Inclus », « Non inclus », « Hypothèses » (contenus fournis par le client avant R3, deux cycles de retours par round, évolutions hors périmètre facturées au taux journalier en vigueur, facturation du jalon suivant après quatre semaines de suspension imputable au client, mise en production après règlement du solde).
- Mentions à vérifier et compléter si le générateur existant ne les produit pas déjà : identité complète de KOV (nom, adresse, SIREN ou SIRET, statut), identité et adresse du client, date et numéro, durée de validité (30 jours par défaut), description détaillée, quantités, prix unitaires HT, total HT, taux et montant de TVA ou mention de franchise, total TTC, délai d'exécution, conditions et échéances de paiement, pénalités de retard et indemnité forfaitaire pour frais de recouvrement de 40 € (clients professionnels), zone « Bon pour accord ». Pour les devis destinés à des particuliers, signale-moi les mentions de consommation à ajouter.
- Un **instantané JSON** complet de la configuration et des paramètres utilisés (taux, coût de revient, version des références) est stocké avec le devis, pour pouvoir expliquer le prix plus tard même si les paramètres changent.
- Une configuration peut être dupliquée et versionnée (v1, v2) avant l'envoi.
- Anticipation de la facturation électronique : la réception est obligatoire pour toutes les entreprises depuis le 1er septembre 2026 et l'émission le sera pour les PME et micro-entreprises au 1er septembre 2027. Ne l'implémente pas, mais vérifie que le futur passage devis vers facture disposera du SIREN client, de l'adresse et de la catégorie d'opération (prestations de services).

Textes destinés au client : français sobre, phrases naturelles, aucun superlatif marketing, **aucun tiret cadratin ni demi-cadratin** (utiliser deux-points, virgules ou parenthèses).

### 4.5 Paramètres (`/admin/pricing/settings`)

Écrans d'édition pour : rôles et taux (vente, coût freelance), paramètres de coût de revient par année, coefficients (complexité, urgence, petit projet, majoration des coûts externes), TJM plancher, marge cible, indexation annuelle des prix, régime de TVA et sa date d'effet, catalogue des offres et des modules (création, édition, archivage, jamais de suppression physique d'un module déjà utilisé dans un devis), bandes de marché par offre, références de marché, gabarits de texte.

Toute modification de paramètre crée une nouvelle version datée. Les configurations en cours gardent la version avec laquelle elles ont été créées, sauf recalcul explicite.

### 4.6 Rounds de production

| Round | Contenu |
|---|---|
| R0 Cadrage | Brief, objectifs, périmètre, contraintes, budget |
| R1 Architecture | Arborescence, parcours, fonctionnalités, modèle de données |
| R2 Direction créative | Moodboard, principes graphiques, typographie |
| R3 Design | Interfaces, responsive, design system |
| R4 Build | Développement, intégrations, CMS |
| R5 Motion et polish | Animations, micro-interactions |
| R6 QA et lancement | Recette, SEO technique, performance, analytics, mise en production |
| R7 Evolve | Abonnements, évolutions |

### 4.7 Historique et réel consommé

Liste des configurations avec statut (brouillon, devis généré, envoyé, signé, perdu) et motif de perte. Sur un projet signé, saisie des jours réellement consommés par rôle, puis affichage de l'écart vendu contre consommé et du TJM réalisé. C'est l'indicateur principal de pilotage du studio : le schéma doit le permettre dès la première version, même si l'écran reste simple.

## 5. Données de départ (seed)

### 5.1 Rôles et taux 2027

Les taux de vente sont volontairement proches des TJM de freelances confirmés, faute de portfolio établi. Certains sont inférieurs au coût d'un freelance : c'est une réalité du modèle que l'outil doit rendre visible, pas corriger.

```json
[
  {"code": "STRAT",  "label": "Cadrage et stratégie",                        "sell_rate": 480, "freelance_cost": null, "internal_only": true},
  {"code": "UX",     "label": "UX et architecture",                          "sell_rate": 440, "freelance_cost": 450},
  {"code": "UI",     "label": "Direction artistique et design d'interface",  "sell_rate": 420, "freelance_cost": 400},
  {"code": "FRONT",  "label": "Développement front et intégration",          "sell_rate": 420, "freelance_cost": 430},
  {"code": "FULL",   "label": "Développement full-stack (Supabase, API)",    "sell_rate": 460, "freelance_cost": 480},
  {"code": "MOTION", "label": "Motion design et 3D WebGL",                   "sell_rate": 460, "freelance_cost": 450},
  {"code": "QA",     "label": "Recette, SEO technique, mise en production",  "sell_rate": 380, "freelance_cost": null, "internal_only": true},
  {"code": "COPY",   "label": "Rédaction",                                   "sell_rate": 460, "freelance_cost": 411, "default_subcontracted": true},
  {"code": "SEO",    "label": "SEO éditorial",                               "sell_rate": 550, "freelance_cost": 499, "default_subcontracted": true},
  {"code": "PHOTO",  "label": "Photographie",                                "sell_rate": 600, "freelance_cost": 522, "default_subcontracted": true}
]
```

Paramètres globaux : majoration des coûts externes 10 % ; coefficients de complexité simple 0,9, standard 1,0, élevée 1,2, critique 1,4 ; TJM plancher 420 € ; marge cible 15 % ; indexation 2028 +5 %, 2029 +10 % par rapport à 2027 ; taux évolution hors périmètre 450 € par jour ; validité des devis 30 jours.

### 5.2 Offres et composition par défaut

Jours de production réels (échanges client et révisions prévues inclus). Le test de calibrage (section 7) compare le prix calculé au prix de référence de la grille.

**Landing page premium** (référence 2 800 €, fourchette 2 000 à 4 000 €, coûts externes 100 €, délai 3 à 5 semaines)
| Round | Module | Jours par rôle |
|---|---|---|
| R0 | Cadrage court et messages clés | STRAT 0,5 |
| R1 | Structure de la page | UX 0,5 |
| R2-R3 | Direction artistique et design desktop et mobile | UI 1,8 |
| R4 | Intégration Next.js | FRONT 1,6 |
| R5 | Animations d'entrée et de scroll | MOTION 0,6 |
| R6 | Recette, analytics, mise en ligne | QA 0,5 |

**Site vitrine premium** (référence 7 000 €, fourchette 5 500 à 9 000 €, coûts externes 300 €, délai 8 à 12 semaines)
| Round | Module | Jours par rôle |
|---|---|---|
| R0 | Atelier de cadrage et note de cadrage | STRAT 0,8 |
| R1 | Arborescence et wireframes (jusqu'à 6 pages) | UX 1,6 |
| R2 | Direction artistique | UI 1,6 |
| R3 | Design de 6 pages, desktop et mobile, design system léger | UI 3,2 |
| R4 | Intégration Next.js et CMS | FRONT 4,4 ; FULL 1,2 |
| R5 | Motion et micro-interactions standard | MOTION 1,6 |
| R6 | Recette, SEO technique, performance, analytics, mise en production | QA 1,6 |

**Site premium avancé** (référence 13 500 €, fourchette 10 000 à 20 000 €, coûts externes 1 200 €, délai 14 à 20 semaines)
| Round | Module | Jours par rôle |
|---|---|---|
| R0 | Cadrage approfondi (deux ateliers) | STRAT 1,5 |
| R1 | Architecture 10 à 20 pages, parcours, contenus | UX 3 |
| R2 | Direction artistique complète | UI 2,5 |
| R3 | Design de 12 gabarits et design system | UI 6 |
| R4 | Build Next.js et CMS riche | FRONT 7 ; FULL 2,5 |
| R5 | Motion avancé (scroll, transitions de page) | MOTION 3,5 |
| R6 | Recette, SEO, performance, accessibilité, analytics | QA 3 |

**Outil métier ou espace client** (référence 16 000 €, fourchette 9 000 à 35 000 €, coûts externes 600 €, délai 16 à 24 semaines, marge d'aléa recommandée 10 %)
| Round | Module | Jours par rôle |
|---|---|---|
| R0 | Cadrage fonctionnel et modèle de données | STRAT 2 ; FULL 1 |
| R1 | Spécifications, parcours, wireframes | UX 4 |
| R2 | Déclinaison de la direction artistique | UI 1,5 |
| R3 | Design des écrans (environ 12) et composants | UI 4,5 |
| R4 | Authentification, rôles, modèle de données, RLS, écrans | FULL 10 ; FRONT 6 |
| R5 | Polish et micro-interactions | MOTION 1 |
| R6 | Recette, sécurité, mise en production, tests | QA 3 ; FULL 1 |
| R0-R6 | Pilotage et recette avec le client | STRAT 2 |

**Module immersif 3D WebGL** (référence 4 500 €, fourchette 2 500 à 12 000 €, coûts externes 400 €, vendu en complément d'un site)
| Round | Module | Jours par rôle |
|---|---|---|
| R0 | Cadrage de la scène | STRAT 0,5 |
| R2 | Concept visuel 3D | UI 1,5 |
| R4 | Scène Three.js ou React Three Fiber, optimisation | MOTION 6,5 ; FRONT 0,5 |
| R6 | Tests de performance multi-appareils | QA 1 |

**Audit UX, technique et SEO** (référence 1 500 €, fourchette 900 à 3 000 €, délai 2 à 3 semaines)
| Round | Module | Jours par rôle |
|---|---|---|
| R0-R6 | Analyse stratégique et restitution | STRAT 1 |
| R1 | Audit UX | UX 1 |
| R6 | Audit performance et SEO technique | QA 1 |

### 5.3 Modules optionnels

| Module | Round | Jours par rôle | Externes | Quantité |
|---|---|---|---|---|
| Page supplémentaire sur gabarit existant | R3-R4 | UI 0,3 ; FRONT 0,4 | | par page |
| Nouveau gabarit de page | R3-R4 | UI 1 ; FRONT 1 | | par gabarit |
| Version multilingue (hors traduction) | R4 | FRONT 1 ; FULL 0,5 ; QA 0,5 | | par langue |
| Traduction professionnelle | R4 | | 400 € | par langue, jusqu'à 3 000 mots |
| Rédaction des contenus | R1-R3 | COPY 0,5 | | par page |
| Shooting photo | R2 | PHOTO 0,5 | 100 € | par demi-journée |
| Blog ou actualités (gabarits, CMS, 3 articles intégrés) | R3-R4 | UI 1 ; FRONT 1,5 ; FULL 0,5 | | |
| Formulaire qualifié et envoi vers le CRM | R4 | FRONT 0,5 ; FULL 1 | | |
| Prise de rendez-vous intégrée | R4 | FRONT 0,5 | | |
| Simulateur ou calculateur (ex. capacité d'emprunt) | R1-R4 | UX 1 ; UI 0,5 ; FRONT 2 ; FULL 1 | | par simulateur |
| Espace client simple (connexion, documents partagés) | R1-R6 | UI 1 ; FRONT 2 ; FULL 4 ; QA 1 | | |
| Écran de tableau de bord supplémentaire | R3-R4 | UI 0,5 ; FRONT 1 ; FULL 0,5 | | par écran |
| Intégration d'API tierce | R4 | FULL 1,5 | | par intégration |
| Rôles et permissions avancés | R4 | FULL 2 | | |
| Animation de scroll avancée ou transitions de page | R5 | MOTION 2 | | |
| Scène 3D en hero | R2-R5 | UI 1 ; MOTION 4 | | |
| Visite 360° | R4 | MOTION 1 | 150 € | par scène |
| Modèle 3D sur mesure (objet simple) | R4 | MOTION 1,5 | | par objet |
| Design system documenté (Figma et composants) | R3-R4 | UI 2 ; FRONT 2 | | |
| Audit d'accessibilité simplifié | R6 | QA 1,5 | | |
| SEO éditorial initial (mots-clés, 10 pages) | R1 | SEO 2 | | |
| Migration de contenus depuis l'ancien site | R4 | FRONT 1 | | par tranche de 20 pages |
| Formation au CMS | R6 | STRAT 0,5 | | par demi-journée |
| Infrastructure au nom du client (Vercel, Supabase) | R6 | FULL 0,5 | | |
| Pages légales et bandeau cookies (structure technique, contenus validés par le client) | R4 | UX 0,5 ; FRONT 0,5 | | |
| Cadrage payant autonome, déductible en cas de signature | R0 | STRAT 2 | | |

Le module « Pages légales » et tout module touchant à des contenus réglementés (secteur financier notamment) doivent générer dans le devis une hypothèse explicite : la validation des mentions légales et réglementaires relève du client.

### 5.4 Abonnements

| Formule | Prix mensuel 2027 | Jours par mois | Externes par mois | Contenu |
|---|---|---|---|---|
| Essentiel | 95 € | 0,15 | 10 € | Mises à jour, monitoring, sauvegardes, hébergement géré, 1 h de support |
| Évolution | 420 € | 0,7 | 15 € | Essentiel, évolutions, suivi analytics trimestriel, SEO |
| Support outil métier | 800 € | 1,2 | 50 € | Infrastructure dédiée, supervision, correctifs, 1 jour d'évolutions, délai d'intervention garanti |

### 5.5 Références de marché (table `pricing_market_benchmarks`)

Chaque référence porte : libellé, valeur, unité, niveau d'expérience, zone, source, URL, date de consultation, nature (statistique de plateforme, observation individuelle, page commerciale). Consultation initiale : 27 septembre 2026. Les valeurs Malt portent sur des freelances expérimentés actifs sur les trois derniers mois.

| Référence | Valeur | Source |
|---|---|---|
| Développeur full-stack expérimenté, France | 557 €/j | Malt, malt.fr/t/barometre-tarifs/tech/developpeur-backend/developpeur-fullstack |
| Développeur full-stack, Bordeaux | 535 €/j | Malt, même page |
| Développeur full-stack, 3 à 7 ans / 0 à 2 ans | 426 € / 311 €/j | Malt, même page |
| Développeur ReactJS expérimenté / 3 à 7 ans | 563 € / 420 €/j | Malt, malt.fr/t/barometre-tarifs/tech/developpeur-frontend/developpeur-reactjs |
| Webdesigner expérimenté, France / Bordeaux | 423 € / 421 €/j | Malt, malt.fr/t/barometre-tarifs/web-graphic-design/webdesigner |
| Webdesigner 3 à 7 ans | 340 €/j | Malt, même page |
| UX designer expérimenté | 507 €/j | Malt, même page |
| Directeur artistique expérimenté | 402 €/j | Malt, même page |
| Motion designer expérimenté / 3 à 7 ans | 419 € / 334 €/j | Malt, malt.fr/t/barometre-tarifs/image-son/motion-designer |
| Photographe expérimenté | 522 €/j | Malt, malt.fr/t/barometre-tarifs/image-son |
| Concepteur-rédacteur expérimenté | 411 €/j | Malt, malt.fr/t/barometre-tarifs/communication/concepteur-redacteur |
| Rédacteur web expérimenté | 373 €/j | Malt, malt.fr/t/barometre-tarifs/communication/redacteur-web |
| Consultant SEO | 499 €/j | Baromètre Malt 2026 cité par mission-freelances.fr (source secondaire) |
| Développeurs Three.js / WebGL | 350 à 500 €/j | Profils Malt consultés individuellement (observation, pas statistique) |
| Site vitrine par un freelance | 1 000 à 5 000 € | Pages tarifaires d'agences et plateformes, 2026 (ordre de grandeur) |
| Site vitrine par une agence | 3 500 à 8 000 € | Idem |
| Site sur mesure en agence, haut de fourchette | 15 000 € et plus | Idem |
| Maintenance technique de site | 60 à 250 €/mois | Idem |

Bandes de marché par offre (hypothèses KOV, éditables) : landing page freelance 800 à 2 000 €, agence 2 000 à 4 000 €, premium au-delà ; site vitrine freelance 1 000 à 5 000 €, agence 3 500 à 8 000 €, premium 8 000 à 15 000 € ; site avancé agence 10 000 à 20 000 €, premium au-delà ; outil métier 9 000 à 35 000 € ; module 3D 2 500 à 12 000 € ; audit 900 à 3 000 €.

**Pas de scraping** de Malt ni d'autres plateformes : les références sont saisies à la main, avec leur source et leur date. L'écran des références affiche l'âge de chaque donnée et un bouton de mise à jour manuelle.

## 6. Modèle de données indicatif

À adapter après la phase 0 :

- `pricing_settings_versions` (année, régime, paramètres de coût de revient, coefficients, TVA, date d'effet)
- `pricing_roles`, `pricing_offers`, `pricing_modules`, `pricing_module_role_days`, `pricing_offer_default_modules`
- `pricing_market_benchmarks`, `pricing_market_bands`
- `pricing_text_templates` (inclus, non inclus, hypothèses, descriptions de modules)
- `pricing_configurations` (client, offre, sélection, quantités, sous-traitance par rôle, options, conditions, statut, version, lien vers le devis existant, instantané JSON du calcul)
- `pricing_actuals` (configuration, rôle, jours consommés)

RLS : accès réservé au rôle admin existant. Aucune donnée de pricing exposée côté client public.

## 7. Tests attendus

Tests unitaires du moteur, au minimum :

1. **Calibrage** : chaque offre par défaut, paramètres 2027, donne un prix à moins de 10 % de son prix de référence. En cas d'écart, le test signale sans modifier les taux.
2. **Petit projet** : la landing page déclenche la majoration de 15 %.
3. **Cas limite du business plan** : site vendu 8 000 € HT pour 25 jours de production et 800 € de coûts externes, paramètres 2028. Marge projet négative (environ -3 500 €), alerte bloquante.
4. **Remise** : 12 % refusée, 10 % acceptée avec motif, refusée sans motif.
5. **TVA** : en franchise, TVA nulle et mention présente ; assujetti, TVA à 20 %.
6. **Échéancier** : somme exactement égale au total TTC, résidu sur la dernière échéance.
7. **Arrondi** : prix HT arrondi à 50 € près, calculs en centimes sans erreur de flottant.
8. **Sous-traitance** : cocher FRONT en sous-traité à 430 € pour une vente à 420 € déclenche l'alerte de marge par rôle.
9. **Coût de revient** : paramètres 2027 donnent environ 301 € par jour, paramètres 2028 environ 427 €.
10. **Fraîcheur** : une référence de plus de 180 jours déclenche le bandeau.

Plus un test d'intégration : une configuration validée crée un devis dans le module existant, avec le bon nombre de lignes, les bons totaux et l'instantané JSON attaché.

## 8. Interface

Outil interne dense mais lisible : je dois pouvoir chiffrer un projet en moins de cinq minutes. Suis le design system de l'admin existant. Chiffres en police à chasse fixe tabulaire pour l'alignement des montants. Libellés en langage clair (« Jours de design », pas `role_days_ui`). Les alertes expliquent ce qui pose problème et comment le corriger. Navigation au clavier, focus visible, contraste suffisant, mouvement réduit respecté. Pas d'animation décorative.

## 9. Phases et définition de fini

| Phase | Contenu | Fini quand |
|---|---|---|
| 0 | Exploration et plan | Plan validé par moi |
| 1 | Schéma, migrations, seed | Migrations locales passent, seed chargé, types générés |
| 2 | Moteur de calcul et tests | Les 10 tests unitaires passent |
| 3 | Écrans de paramètres | Taux, modules, références et textes éditables et versionnés |
| 4 | Configurateur | Parcours complet, récapitulatif temps réel, alertes |
| 5 | Génération du devis | Devis créé dans le module existant, PDF conforme, test d'intégration vert |
| 6 | Historique, réel consommé, documentation | Écart vendu contre consommé visible ; section README expliquant formules, paramètres et mise à jour des références |

À la fin de chaque phase, arrête-toi et résume : fichiers touchés, commandes lancées, résultats des tests, points ouverts.
