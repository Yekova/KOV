// Le vocabulaire de la validation : statuts, libellés, couleurs.
//
// Aucune valeur n'est inventée ici. Les statuts sont exactement ceux que
// la base contraint (20260930120000), et les couleurs sont les tokens
// --kov-status-* posés lors du passage en DA claire. Rien de nouveau
// n'entre dans la palette.

export const PAGE_STATUSES = [
  "upcoming",
  "in_progress",
  "client_review",
  "changes_requested",
  "approved",
  "blocked",
] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

// Le cahier des charges listait « En validation » ET « À valider », qui
// décrivent le même moment vu des deux côtés. Un seul statut est retenu,
// nommé d'après CELUI QUI DOIT AGIR : c'est la seule chose qu'un statut
// doit apprendre à celui qui le lit.
export const PAGE_STATUS_LABELS: Record<PageStatus, string> = {
  upcoming: "À venir",
  in_progress: "En cours",
  client_review: "À valider",
  changes_requested: "Modifications demandées",
  approved: "Validé",
  blocked: "Bloqué",
};

// Qui est attendu. Sert les compteurs du §50 — « à traiter par vous » ne
// peut pas se calculer sans cette information.
export const PAGE_STATUS_WAITING_ON: Record<PageStatus, "client" | "kov" | null> = {
  upcoming: null,
  in_progress: "kov",
  client_review: "client",
  changes_requested: "kov",
  approved: null,
  blocked: null,
};

export const PAGE_STATUS_COLORS: Record<PageStatus, string> = {
  upcoming: "var(--kov-steel)",
  in_progress: "var(--kov-status-blue)",
  client_review: "var(--kov-status-purple)",
  changes_requested: "var(--kov-status-orange)",
  approved: "var(--kov-status-green)",
  blocked: "var(--kov-red)",
};

export const COMMENT_STATUSES = ["open", "in_progress", "resolved", "rejected"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  open: "À traiter",
  in_progress: "En cours",
  resolved: "Résolu",
  rejected: "Non retenu",
};

export const COMMENT_STATUS_COLORS: Record<CommentStatus, string> = {
  open: "var(--kov-status-orange)",
  in_progress: "var(--kov-status-blue)",
  resolved: "var(--kov-status-green)",
  rejected: "var(--kov-steel)",
};

/** Un retour encore vivant : il compte dans « ce qui bloque ». */
export function isCommentPending(status: CommentStatus): boolean {
  return status === "open" || status === "in_progress";
}

export const VERSION_STATUSES = ["draft", "published", "superseded", "archived"] as const;
export type VersionStatus = (typeof VERSION_STATUSES)[number];

export const VERSION_STATUS_LABELS: Record<VersionStatus, string> = {
  draft: "Brouillon",
  published: "Publiée",
  superseded: "Remplacée",
  archived: "Archivée",
};

export const DEVICES = ["desktop", "tablet", "mobile"] as const;
export type Device = (typeof DEVICES)[number];

export const DEVICE_LABELS: Record<Device, string> = {
  desktop: "Desktop",
  tablet: "Tablette",
  mobile: "Mobile",
};

/** La largeur de rendu de chaque appareil, en pixels CSS. Sert le cadre du
 *  visualiseur, pas le fichier : une maquette mobile s'affiche dans un
 *  cadre étroit même si son image fait 2000 px de large. */
export const DEVICE_FRAME_WIDTH: Record<Device, number> = {
  desktop: 1440,
  tablet: 834,
  mobile: 390,
};

export type AuthorSide = "client" | "admin";

/** Qui parle, du point de vue de celui qui lit. Le portail dit « KOV »
 *  pour l'autre côté ; l'admin dit « le client ». Jamais de nom inventé
 *  quand le profil n'en porte pas. */
export function describeAuthor(side: AuthorSide, name: string | null, viewer: AuthorSide): string {
  if (name?.trim()) return name.trim();
  if (side === viewer) return "Vous";
  return side === "admin" ? "KOV" : "Le client";
}
