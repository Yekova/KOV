# Opportunités de netlinking — KOV

**Aucun lien n'a été créé, demandé ou acheté.** Ce document est une stratégie, pas une campagne
exécutée. Tout ce qui suit demande une action humaine et, dans la plupart des cas, une relation réelle.

---

## Le principe, d'abord

Un backlink qui compte est la trace d'une relation qui existe : un client qui cite son prestataire, une
association dont on est membre, un outil qu'on a publié et que quelqu'un trouve utile. Un backlink
acheté, échangé en réseau ou déposé dans un annuaire généraliste est au mieux ignoré, au pire un motif
d'action manuelle dans Search Console.

**KOV a un actif que la plupart des agences n'ont pas** : un studio virtuel en 360°, réellement
construit et en ligne. C'est le genre de chose qui se partage sans qu'on le demande — et c'est autour
de ça que la stratégie ci-dessous s'organise, plutôt qu'autour de la soumission d'annuaires.

---

## 1. Clients et partenaires — le socle

C'est la source la plus solide, et la seule qui se construise sans rien demander à un inconnu.

| Action | Détail |
|---|---|
| **Mention en pied de page client** | « Site conçu par KOV », lien vers `kov-agency.site`. À négocier **au moment du devis**, jamais après : c'est une ligne de contrat, pas une faveur. |
| **Page « Nos partenaires » / « Ils nous accompagnent »** | Beaucoup d'entreprises en ont une. Y figurer est naturel et durable. |
| **Étude de cas croisée** | KOV publie l'étude de cas sur `/journal`, le client publie la sienne côté communication. Deux contenus distincts, deux liens réciproques, aucune artificialité. |
| **Témoignage sur le site du client** | Si un client publie des retours d'expérience, un témoignage signé « KOV » avec un lien est une citation légitime. |

**Prérequis : la section projets du site réserve encore plusieurs cartes** (voir `src/data/projects.ts`).
Tant qu'un projet n'a pas sa page d'étude de cas, il n'y a rien à lier. **C'est le premier chantier**,
avant toute démarche extérieure.

---

## 2. Annuaires professionnels — pertinents seulement

Uniquement ceux où une vraie entreprise du secteur est attendue. Ils apportent surtout de la
**cohérence NAP** (nom, adresse, téléphone identiques partout), signal que Google croise pour valider
l'existence d'une entreprise.

- **Google Business Profile** — de loin le plus important, et un prérequis au référencement local.
  Voir la réserve sur l'adresse dans `SEO_AUDIT.md` §14 : une fiche peut masquer l'adresse et déclarer
  une zone de chalandise, ce qui convient à un studio travaillant surtout à distance.
- **Annuaires officiels** où l'entreprise figure déjà de droit : `annuaire-entreprises.data.gouv.fr`,
  Societe.com, Pappers. Aucune démarche — vérifier simplement que la dénomination y correspond à celle
  du site.
- **CCI Bordeaux Gironde**, **French Tech Bordeaux**, **Bordeaux Métropole / Invest in Bordeaux** :
  écosystème local réel. Adhésion ou inscription = présence légitime dans leur annuaire.
- **Sollicitudes sectorielles** : Sortlist, Clutch, La Fabrique du Net, Codeur.com. Utiles si KOV
  répond réellement à des appels d'offres par leur biais ; inutiles autrement.

**À éviter formellement :** annuaires généralistes gratuits, « 500 annuaires en 1 clic », fermes de
liens, échanges triangulaires. Aucun bénéfice, risque réel.

---

## 3. Contenu de référence — le levier le plus durable

`/journal` existe déjà et est techniquement prêt (structured data `BlogPosting`, sitemap, OG complets).
Ce qui lui manque, c'est du volume. Les formats qui gagnent des liens **sans les demander** :

- **Retours techniques concrets** : ce que coûte réellement une visite 360° en WebGL, ce qu'on apprend
  à construire un studio virtuel en Three.js, comment on tient 60 fps sur un GPU intégré. Du vécu
  chiffré — c'est ce que les développeurs citent.
- **Prises de position argumentées** sur le métier : ce qu'on refuse de faire et pourquoi. Le contenu
  qui prend un parti est repris ; le contenu neutre ne l'est pas.
- **Ressources réutilisables** : un guide de cahier des charges, une grille d'estimation, un
  comparatif honnête. Ce qui est utile hors contexte est ce qui se lie.
- **Le studio virtuel comme démonstration** : `/studio` est un objet de curiosité en soi. Une
  publication expliquant comment il est construit, avec le lien vers l'expérience, est exactement le
  type de contenu que r/webdev, Hacker News ou les newsletters front-end relaient.

**Règle :** un article par mois qui apporte quelque chose vaut mieux que dix qui recyclent. Rien de ce
qui précède n'a d'intérêt si le contenu n'est pas réellement bon.

---

## 4. Communautés et plateformes techniques

Des liens souvent en `nofollow`, mais qui apportent du trafic qualifié et de la notoriété de marque —
et la notoriété de marque est elle-même un signal.

- **Awwwards, CSS Design Awards, Godly, Land-book, Httpster** : soumettre le site et `/studio`. Le
  niveau de finition visuelle du projet est cohérent avec ces vitrines.
- **GitHub** : si un composant du studio virtuel ou un utilitaire est publiable en open source, le
  README lie naturellement vers le site.
- **CodePen, Three.js forum, r/webgl, r/threejs** : partager une démo technique réelle, pas une
  plaquette.
- **Dev.to, Hashnode** : republier un article du journal **avec `rel="canonical"` vers l'original sur
  kov-agency.site** — sinon c'est du contenu dupliqué qui concurrence sa propre source.
- **LinkedIn** : le seul réseau où le B2B français se joue vraiment. Prérequis : la page n'existe pas
  encore (voir `SEO_AUDIT.md` §14, point 5).

---

## 5. Presse et écosystème local

- **Presse locale** : Rue89 Bordeaux, Objectif Aquitaine, La Tribune Bordeaux. Un angle réel est
  nécessaire — « un studio bordelais a construit ses bureaux en 3D navigable » en est un ; « une agence
  web lance son site » n'en est pas un.
- **Podcasts et newsletters métier** : intervention sur un sujet technique précis.
- **Écoles et formations** (Ynov, Digital Campus, IUT Bordeaux) : intervention ou jury de projet →
  mention sur leur site, en `.edu`-équivalent français, très solide.
- **Événements** : meetups front-end bordelais, BDX I/O. Sponsoriser ou intervenir donne une page
  intervenant avec lien.

---

## 6. Citations de marque sans lien

Google reconnaît les mentions non liées. Elles se soignent :

- **Cohérence NAP** : la dénomination et la ville doivent être identiques sur le site, Google Business
  Profile, LinkedIn et les annuaires officiels. Une variation de forme juridique ou d'adresse affaiblit
  le rapprochement.
- **Alertes** : une alerte Google sur « KOV agency » et « kov-agency.site » permet de repérer une
  mention non liée et de demander poliment le lien. C'est la demande de lien la plus légitime qui
  existe — quelqu'un parle déjà de vous.

---

## Ordre de priorité

| # | Action | Effort | Impact |
|---|---|---|---|
| 1 | Publier les études de cas des projets réels (prérequis à tout le reste) | élevé | élevé |
| 2 | Google Business Profile (sous réserve de l'arbitrage adresse) | faible | élevé en local |
| 3 | Mention « conçu par KOV » négociée au devis, sur les prochains projets | nul | élevé, cumulatif |
| 4 | Créer les profils sociaux réels et déclarer `sameAs` | faible | moyen |
| 5 | Un article de fond par mois sur `/journal` | continu | élevé à terme |
| 6 | Soumettre le site et `/studio` aux vitrines design | faible | moyen |
| 7 | Écosystème bordelais : CCI, French Tech, écoles | moyen | moyen, très durable |
| 8 | Annuaires sectoriels, uniquement si vraiment utilisés | faible | faible |

---

## Ce qu'il ne faut pas faire

Achat de liens · PBN et réseaux de sites · échanges massifs ou triangulaires · commentaires de blog et
profils de forum optimisés · communiqués de presse diffusés en masse pour l'ancre · articles invités
sur des sites créés uniquement pour héberger des liens · ancres sur-optimisées répétées (« agence web
Bordeaux » cinquante fois).

Tout cela relève des politiques anti-spam de Google, et les sanctions se constatent dans Search Console
— ce qui suppose, précisément, que Search Console soit configurée (`SEO_AUDIT.md` §14, point 1).
