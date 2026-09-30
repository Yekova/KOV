// Les formes échangées entre le serveur et l'interface de validation.
//
// Elles ne recopient pas les lignes de la base telles quelles : ce qui
// part vers le navigateur est déjà filtré (une page invisible n'est pas
// envoyée puis masquée) et déjà résolu (les chemins de stockage sont
// devenus des URL signées). Le client ne reçoit jamais un chemin d'objet.

import type { AuthorSide, CommentStatus, Device, PageStatus, VersionStatus } from "./status";

export interface DesignVersion {
  id: string;
  pageId: string;
  label: string;
  number: number;
  status: VersionStatus;
  changelog: string | null;
  /** URL signées, une par appareil disponible. Les appareils absents ne
   *  figurent pas : une clé manquante veut dire « pas de maquette », et
   *  non « image cassée ». */
  assets: Partial<Record<Device, string>>;
  /** Préversion en ligne, seulement si l'URL a passé la validation
   *  d'origine côté serveur. */
  previewUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface DesignComment {
  id: string;
  pageId: string;
  versionId: string;
  parentId: string | null;
  device: Device;
  authorId: string;
  authorSide: AuthorSide;
  authorName: string | null;
  /** Nulles pour une réponse, et pour un commentaire général non épinglé. */
  x: number | null;
  y: number | null;
  body: string;
  status: CommentStatus;
  isBlocking: boolean;
  mentionedIds: string[];
  attachmentUrl: string | null;
  createdAt: string;
  editedAt: string | null;
  resolvedAt: string | null;
  /** Calculé côté serveur : seul l'auteur modifie son propre message, et
   *  seulement tant qu'il n'est pas résolu (§48). L'interface n'a pas à
   *  redériver la règle. */
  canEdit: boolean;
  replies: DesignComment[];
}

export interface DesignPage {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  status: PageStatus;
  visibleToClient: boolean;
  /** Position posée à la main par l'admin. Nulle = l'agencement
   *  automatique décide, ce qui est le cas par défaut. */
  position: { x: number; y: number } | null;
  versions: DesignVersion[];
  /** La version que l'on ouvre par défaut : la dernière publiée, ou la
   *  dernière tout court côté studio. */
  currentVersionId: string | null;
  /** Les fils de la version ouverte, réponses comprises. Les versions
   *  précédentes ne sont pas envoyées : leurs retours ne s'affichent que
   *  si l'on ouvre la version en question, et les charger d'avance
   *  gonflerait la réponse sans que personne les regarde. */
  threads: DesignComment[];
  /** Tous les retours racines portés par la version ouverte, réglés
   *  compris — c'est le nombre que montre le nœud « Retours ». */
  commentCount: number;
  /** Ceux qui attendent encore quelque chose (open + in_progress). */
  openCount: number;
  /** Ceux qui interdisent la validation tant qu'ils vivent (§27). */
  blockingCount: number;
  approvedAt: string | null;
}

export interface DesignApproval {
  id: string;
  pageId: string | null;
  versionId: string | null;
  decision: "approved" | "changes_requested";
  approverName: string | null;
  approverSide: AuthorSide;
  isOverride: boolean;
  comment: string | null;
  createdAt: string;
}

export interface DesignActivityEntry {
  id: string;
  pageId: string | null;
  actorName: string | null;
  actorSide: AuthorSide | "system";
  event: string;
  summary: string;
  createdAt: string;
}

/** Ce que le §50 demande d'afficher en permanence, pour que le client
 *  sache exactement ce qui bloque. Chaque nombre vient d'un compte réel. */
export interface ValidationTally {
  open: number;
  waitingOnClient: number;
  waitingOnKov: number;
  approvedPages: number;
  totalPages: number;
}

export interface ValidationBoard {
  projectId: string;
  projectName: string;
  viewer: AuthorSide;
  viewerId: string;
  pages: DesignPage[];
  tally: ValidationTally;
  /** Nulle tant que toutes les pages ne sont pas validées : le nœud de
   *  validation finale existe alors sans être actionnable. */
  finalApproval: DesignApproval | null;
  canApproveAll: boolean;
}
