// Ce que le tableau de bord sait afficher, et à quelle taille.
//
// La liste vit ici et non en base : c'est du code qui décide quels blocs
// existent, puisque c'est du code qui les rend. La base ne retient que
// l'arrangement choisi par chacun (voir la migration
// 20260930160000_create_dashboard_preferences.sql).

export const DASHBOARD_SURFACES = ["admin", "client"] as const;
export type DashboardSurface = (typeof DASHBOARD_SURFACES)[number];

/**
 * Les largeurs proposées, en colonnes sur douze.
 *
 * Cinq valeurs et pas un curseur continu : une grille de douze n'a que
 * ces divisions qui tombent juste, et laisser choisir 5 ou 7 produit des
 * rangées bancales que personne n'a voulues.
 */
export const BLOCK_SPANS = [3, 4, 6, 8, 12] as const;
export type BlockSpan = (typeof BLOCK_SPANS)[number];

export const SPAN_LABELS: Record<BlockSpan, string> = {
  3: "Quart",
  4: "Tiers",
  6: "Moitié",
  8: "Deux tiers",
  12: "Pleine largeur",
};

export interface DashboardBlockDefinition {
  id: string;
  /** Ce que l'utilisateur lit dans l'éditeur. */
  label: string;
  defaultSpan: BlockSpan;
  /** Un bloc obligatoire ne peut pas être masqué. Réservé à ce dont
   *  l'absence rendrait l'écran inutilisable — pas à ce qu'on juge
   *  important. */
  required?: boolean;
}

// ── LE STUDIO ────────────────────────────────────────────────────────
//
// L'ordre et les largeurs par défaut reproduisent la composition
// existante : personne ne doit voir son tableau de bord changer parce
// qu'il est devenu arrangeable.

export const ADMIN_BLOCKS: DashboardBlockDefinition[] = [
  { id: "kpi-revenue", label: "Chiffre d'affaires", defaultSpan: 3 },
  { id: "kpi-outstanding", label: "Encours à recouvrer", defaultSpan: 3 },
  { id: "kpi-overdue", label: "Factures en retard", defaultSpan: 3 },
  { id: "kpi-margin", label: "Marge", defaultSpan: 3 },
  { id: "kpi-leads", label: "Leads actifs", defaultSpan: 3 },
  { id: "kpi-conversion", label: "Taux de conversion", defaultSpan: 3 },
  { id: "commercial-pipeline", label: "Pipeline commercial", defaultSpan: 8 },
  { id: "agenda", label: "Agenda", defaultSpan: 4 },
  { id: "project-table", label: "Projets en cours", defaultSpan: 8 },
  { id: "lead-feed", label: "Derniers leads", defaultSpan: 4 },
  { id: "task-feed", label: "Tâches", defaultSpan: 8 },
  { id: "team-workload", label: "Charge de l'équipe", defaultSpan: 4 },
  { id: "kpi-hours", label: "Heures du jour", defaultSpan: 4 },
  { id: "revenue-chart", label: "Courbe de revenus", defaultSpan: 8 },
  { id: "revenue-donut", label: "Répartition des revenus", defaultSpan: 4 },
  { id: "activity-feed", label: "Activité récente", defaultSpan: 8 },
  { id: "project-pipeline", label: "Pipeline projet", defaultSpan: 4 },
];

// ── LE PORTAIL ───────────────────────────────────────────────────────

export const CLIENT_BLOCKS: DashboardBlockDefinition[] = [
  // Ce qui attend une action du client ne se masque pas : c'est la seule
  // chose que le tableau de bord doit à son lecteur.
  { id: "action-required", label: "Ce qui vous attend", defaultSpan: 8, required: true },
  { id: "relation", label: "Votre interlocuteur", defaultSpan: 4 },
  { id: "project-story", label: "Projet principal", defaultSpan: 8 },
  { id: "project-showcase", label: "Autres projets", defaultSpan: 8 },
  { id: "deadlines", label: "Prochaines échéances", defaultSpan: 4 },
  { id: "documents", label: "Documents récents", defaultSpan: 4 },
];

export function blocksFor(surface: DashboardSurface): DashboardBlockDefinition[] {
  return surface === "admin" ? ADMIN_BLOCKS : CLIENT_BLOCKS;
}
