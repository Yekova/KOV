import type { ComponentType } from "react";
import {
  RadarChart,
  GrowthBars,
  PerformanceGauge,
  FoundationStack,
  DeviceFrames,
  JourneyPath,
} from "@/components/home/ActivationCharts";

// Les six cartes d'approche.
//
// Elles vivaient dans ActivationWindow, qui a été remplacé par la roue.
// Elles en sortent parce qu'elles sont désormais lues à DEUX endroits :
// l'arc de trois cartes qui dépasse sous la hero, et la roue elle-même.
// Deux copies de cette liste divergeraient au premier changement de
// libellé, et l'arc annoncerait alors des cartes que la roue ne contient
// pas.
//
// L'ordre suit le cahier des charges d'origine : Introduction → Design →
// Responsive → Performance → Accompagnement → Résultats.

export interface ApproachCard {
  title: string;
  body: string;
  features?: string[];
  /** Une des six compositions graphiques (ActivationCharts). Aucune photo,
   *  aucune vidéo : par choix, pour qu'un trou en forme de banque d'images
   *  ne se retrouve pas à côté de cinq vraies pièces de design. */
  Visual: ComponentType<{ reducedMotion: boolean; active: boolean }>;
  /** Une vraie destination pour le sujet de la carte. Absente pour
   *  « Un vrai accompagnement », qui n'a pas de page évidente — plutôt que
   *  de forcer un lien qui ne correspond pas. */
  href?: string;
}

export const APPROACH_CARDS: ApproachCard[] = [
  {
    title: "Une base solide",
    features: ["Stratégie", "Architecture", "Parcours"],
    body: "Une stratégie claire pour un site qui a du sens.",
    Visual: FoundationStack,
    href: "/#expertise",
  },
  {
    title: "Design sur mesure",
    features: ["Direction artistique", "Design system", "Identité"],
    body: "Une identité unique qui vous ressemble vraiment.",
    Visual: RadarChart,
    href: "/#expertise",
  },
  {
    title: "Responsive par nature",
    features: ["Mobile first", "Touch optimisé", "Layout adaptatif"],
    body: "Une expérience parfaite sur tous les écrans, mobile, tablette, desktop.",
    Visual: DeviceFrames,
    href: "/#expertise",
  },
  {
    title: "Performance durable",
    features: ["Core Web Vitals", "SEO technique", "Chargement"],
    body: "Des sites rapides, optimisés et pensés pour la croissance.",
    Visual: PerformanceGauge,
    href: "/#expertise",
  },
  {
    title: "Un vrai accompagnement",
    features: ["Cadrage", "Suivi", "Évolution"],
    body: "À vos côtés, de l'idée aux résultats, et bien au-delà.",
    Visual: JourneyPath,
  },
  {
    title: "Des résultats concrets",
    features: ["Clarté", "Engagement", "Conversion"],
    body: "Plus de visibilité. Plus d'engagement. Plus d'opportunités.",
    Visual: GrowthBars,
    href: "/#work-gallery",
  },
];

/** Les trois qui dépassent sous la hero : les trois premières de la roue,
 *  pour que l'arc annonce exactement ce qu'on trouvera en descendant. */
export const ARC_CARDS = APPROACH_CARDS.slice(0, 3);

// ── LA GÉOMÉTRIE DE LA ROUE, PARTAGÉE ────────────────────────────────
//
// L'arc de la hero et la roue de la section suivante doivent décrire le
// MÊME cercle, sinon la continuité se voit cassée au moment où l'une
// prend la suite de l'autre. Ces trois nombres sont donc ici, pas dans
// l'un des deux composants.
//
// Ils n'ont pas été vus à l'écran : aucun navigateur ne tourne sur ce
// projet. Ce sont des points de départ raisonnés, groupés exprès pour
// être réglés en une fois.

/** Rayon du cercle, en pixels. Grand devant la hauteur d'une carte (530) :
 *  un rayon court ferait tourner les cartes sur elles-mêmes au lieu de les
 *  faire glisser le long d'un arc. */
export const WHEEL_RADIUS = 1180;

/** Écart angulaire entre deux cartes voisines. À ce rayon, 14° écartent
 *  leurs centres d'environ 288 px — soit un peu moins qu'une largeur de
 *  carte (320), donc elles se chevauchent légèrement comme sur un éventail. */
export const WHEEL_STEP_DEG = 14;

/**
 * Le pas de l'ARC, plus serré que celui de la roue.
 *
 * Le rayon reste commun — c'est lui qui fait la courbe, et elle doit être
 * la même des deux côtés. Seul l'espacement diffère : sous la hero les
 * cartes se chevauchent en éventail, dans la roue elles s'écartent pour
 * être lues une à une.
 *
 * Mesuré à ce rayon, largeur de carte 320 :
 *
 *   14°  centres à 288px   elles se touchent à peine   (la roue)
 *   12°  centres à 247px   23 % de chevauchement
 *   10°  centres à 206px   36 %                        (retenu)
 *    8°  centres à 165px   49 % — la carte du milieu disparaît presque
 */
export const ARC_STEP_DEG = 10;

/** De combien le haut des cartes dépasse sous la hero, en pixels. Un tiers
 *  de la hauteur d'une carte : assez pour qu'on devine un objet, trop peu
 *  pour qu'on le lise. C'est le « suspens ». */
export const ARC_PEEK = 170;
