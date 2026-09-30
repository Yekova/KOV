// Ce que le tableau de bord sait afficher, et la place qu'il prend au
// départ.
//
// La liste vit ici et non en base : c'est du code qui décide quels blocs
// existent, puisque c'est du code qui les rend. La base ne retient que
// l'arrangement choisi par chacun.

export const DASHBOARD_SURFACES = ["admin", "client"] as const;
export type DashboardSurface = (typeof DASHBOARD_SURFACES)[number];

/** Douze colonnes : le seul nombre sous 16 divisible par 2, 3, 4 et 6,
 *  donc le seul qui laisse poser des demis, des tiers et des quarts sans
 *  reste. */
export const GRID_COLUMNS = 12;

/** La hauteur d'une rangée, en pixels. Une carte de hauteur h occupe
 *  h × 48 px plus (h − 1) × 16 px de gouttière. Assez fin pour ajuster
 *  une carte au doigt près, assez gros pour qu'on ne passe pas la
 *  journée à tirer. */
export const ROW_HEIGHT = 48;
export const GRID_GAP = 16;

export interface DashboardBlockDefinition {
  id: string;
  /** Ce que l'utilisateur lit dans l'éditeur. */
  label: string;
  /** Largeur de départ, en colonnes. */
  defaultW: number;
  /** Hauteur de départ, en rangées. Une estimation : le bouton
   *  « Ajuster les hauteurs » la remplace par la mesure réelle du
   *  contenu, ce qu'aucune valeur écrite à l'avance ne peut faire. */
  defaultH: number;
  /** Largeur minimale sous laquelle la carte devient illisible. */
  minW?: number;
  minH?: number;
  /** Un bloc obligatoire ne peut pas être masqué. Réservé à ce dont
   *  l'absence rendrait l'écran inutilisable. */
  required?: boolean;
}

// ── LE STUDIO ────────────────────────────────────────────────────────
//
// L'ordre et les largeurs reproduisent la composition existante :
// personne ne doit voir son tableau de bord changer parce qu'il est
// devenu arrangeable. Les positions x/y en découlent, calculées par
// l'agencement automatique (layout.ts) plutôt qu'écrites ici — deux
// listes à tenir d'accord finiraient par diverger.

export const ADMIN_BLOCKS: DashboardBlockDefinition[] = [
  { id: "kpi-revenue", label: "CA signé", defaultW: 2, defaultH: 3, minW: 2, minH: 2 },
  { id: "kpi-outstanding", label: "CA encaissé", defaultW: 2, defaultH: 3, minW: 2, minH: 2 },
  { id: "kpi-overdue", label: "Reste à encaisser", defaultW: 2, defaultH: 3, minW: 2, minH: 2 },
  { id: "kpi-margin", label: "Projets en cours", defaultW: 2, defaultH: 3, minW: 2, minH: 2 },
  { id: "kpi-leads", label: "Leads actifs", defaultW: 2, defaultH: 3, minW: 2, minH: 2 },
  { id: "kpi-conversion", label: "Taux de conversion", defaultW: 2, defaultH: 3, minW: 2, minH: 2 },
  { id: "commercial-pipeline", label: "Pipeline commercial", defaultW: 8, defaultH: 8, minW: 4, minH: 4 },
  { id: "agenda", label: "Agenda", defaultW: 4, defaultH: 8, minW: 3, minH: 3 },
  { id: "project-table", label: "Projets en cours", defaultW: 8, defaultH: 8, minW: 5, minH: 4 },
  { id: "lead-feed", label: "Derniers leads", defaultW: 4, defaultH: 8, minW: 3, minH: 3 },
  { id: "task-feed", label: "Tâches", defaultW: 8, defaultH: 6, minW: 4, minH: 3 },
  { id: "team-workload", label: "Charge de l'équipe", defaultW: 4, defaultH: 4, minW: 3, minH: 3 },
  { id: "kpi-hours", label: "Heures du jour", defaultW: 4, defaultH: 3, minW: 2, minH: 2 },
  { id: "revenue-chart", label: "Courbe de revenus", defaultW: 8, defaultH: 7, minW: 4, minH: 4 },
  { id: "revenue-donut", label: "Répartition des revenus", defaultW: 4, defaultH: 7, minW: 3, minH: 4 },
  { id: "activity-feed", label: "Activité récente", defaultW: 8, defaultH: 7, minW: 4, minH: 3 },
  { id: "project-pipeline", label: "Pipeline projet", defaultW: 4, defaultH: 7, minW: 3, minH: 4 },
];

// ── LE PORTAIL ───────────────────────────────────────────────────────

export const CLIENT_BLOCKS: DashboardBlockDefinition[] = [
  // Ce qui attend une action du client ne se masque pas : c'est la seule
  // chose que le tableau de bord doit à son lecteur.
  { id: "action-required", label: "Ce qui vous attend", defaultW: 8, defaultH: 5, minW: 4, minH: 3, required: true },
  { id: "relation", label: "Votre interlocuteur", defaultW: 4, defaultH: 10, minW: 3, minH: 4 },
  { id: "project-story", label: "Projet principal", defaultW: 8, defaultH: 7, minW: 4, minH: 4 },
  { id: "project-showcase", label: "Autres projets", defaultW: 8, defaultH: 5, minW: 4, minH: 3 },
  { id: "deadlines", label: "Prochaines échéances", defaultW: 4, defaultH: 5, minW: 3, minH: 3 },
  { id: "documents", label: "Documents récents", defaultW: 4, defaultH: 5, minW: 3, minH: 3 },
];

export function blocksFor(surface: DashboardSurface): DashboardBlockDefinition[] {
  return surface === "admin" ? ADMIN_BLOCKS : CLIENT_BLOCKS;
}
