// La carte de validation, DÉRIVÉE.
//
// ── POURQUOI IL N'Y A PAS DE TABLE DE NŒUDS ──────────────────────────
//
// Le cahier des charges demandait `design_nodes` et `design_edges`, que
// l'admin remplirait à la main. Mais il décrit aussi, en §57, un
// enchaînement fixe : version → commentaires → révisions → nouvelle
// version → validation. Deux descriptions de la même chose finissent par
// se contredire, et le jour où elles divergent, personne ne sait laquelle
// a raison : la carte dirait « en cours » d'une page validée.
//
// La carte est donc calculée à partir de ce qui est déjà vrai — les
// pages, leurs versions, leurs retours, leurs validations. Le seul fait
// qu'aucun calcul ne donne, c'est l'endroit où l'admin a posé une page ;
// c'est la seule chose que la base retient (design_pages.position_x/y).
//
// Conséquence directe et voulue : la carte ne peut pas être fausse, et
// elle ne peut pas être mal rangée (§38) — sans dagre ni elkjs, parce
// qu'un graphe dérivé a une forme connue d'avance.
//
// Ce module ne connaît pas React Flow. Il produit des nœuds et des liens
// en géométrie pure ; l'adaptation au canvas se fait dans le composant.

import type { DesignPage, ValidationBoard } from "./types";
import { DEVICES, type Device, type PageStatus } from "./status";

export type MapNodeKind = "page" | "device" | "feedback" | "revision" | "approval";

interface BaseNode {
  id: string;
  kind: MapNodeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  /** La page dont ce nœud dépend. Le nœud de validation finale n'en a
   *  aucune — c'est le seul. */
  pageId: string | null;
}

export interface PageNode extends BaseNode {
  kind: "page";
  pageId: string;
  title: string;
  index: number;
  status: PageStatus;
  versionLabel: string | null;
  thumbnailUrl: string | null;
  openCount: number;
  blockingCount: number;
}

export interface DeviceNode extends BaseNode {
  kind: "device";
  pageId: string;
  device: Device;
  hasAsset: boolean;
}

export interface FeedbackNode extends BaseNode {
  kind: "feedback";
  pageId: string;
  total: number;
  pending: number;
}

export interface RevisionNode extends BaseNode {
  kind: "revision";
  pageId: string;
  /** L'étiquette de la version en préparation, si elle existe déjà. */
  draftLabel: string | null;
}

export interface ApprovalNode extends BaseNode {
  kind: "approval";
  pageId: null;
  ready: boolean;
  approvedPages: number;
  totalPages: number;
}

export type MapNode = PageNode | DeviceNode | FeedbackNode | RevisionNode | ApprovalNode;

export interface MapEdge {
  id: string;
  source: string;
  target: string;
  /** Sert le surlignage : sélectionner une page allume toute sa chaîne
   *  (§9). Nul pour les liens qui convergent vers la validation finale. */
  pageId: string | null;
}

export interface ValidationMap {
  nodes: MapNode[];
  edges: MapEdge[];
  /** Le cadre occupé, pour cadrer la vue à l'ouverture sans mesurer le
   *  DOM. Un « fit view » qui attend un layout passe une image de travers. */
  bounds: { width: number; height: number };
}

// ── LA GÉOMÉTRIE ─────────────────────────────────────────────────────
//
// Cinq colonnes, une par profondeur. Un graphe dérivé a une profondeur
// maximale connue, donc les colonnes sont des constantes et non le
// résultat d'un tri topologique.

const COLUMN_X = { page: 0, device: 340, feedback: 660, revision: 960, approval: 1280 } as const;

const SIZE = {
  page: { width: 260, height: 168 },
  device: { width: 216, height: 84 },
  feedback: { width: 216, height: 84 },
  revision: { width: 216, height: 84 },
  approval: { width: 252, height: 132 },
} as const;

/** La hauteur d'une ligne d'appareil dans le couloir d'une page. */
const DEVICE_ROW = 104;
/** L'air entre deux couloirs. Assez pour que deux pages ne se lisent pas
 *  comme une seule, pas assez pour obliger à dézoomer. */
const LANE_GAP = 56;

export function buildValidationMap(board: ValidationBoard): ValidationMap {
  const nodes: MapNode[] = [];
  const edges: MapEdge[] = [];

  let cursorY = 0;
  const laneCenters: number[] = [];

  board.pages.forEach((page, index) => {
    const current = page.versions.find((v) => v.id === page.currentVersionId) ?? null;
    const devices = DEVICES.filter((d) => current?.assets[d]);

    // Le couloir doit contenir le plus grand des deux : la carte de page,
    // ou la pile d'appareils.
    const stackHeight = Math.max(devices.length, 1) * DEVICE_ROW - (DEVICE_ROW - SIZE.device.height);
    const laneHeight = Math.max(SIZE.page.height, stackHeight);
    const laneTop = cursorY;
    const laneCenter = laneTop + laneHeight / 2;
    laneCenters.push(laneCenter);

    // Une position posée à la main remplace celle du couloir — et elle
    // emporte les nœuds enfants, qui gardent leur décalage relatif.
    const anchorX = page.position?.x ?? COLUMN_X.page;
    const anchorY = page.position?.y ?? laneCenter - SIZE.page.height / 2;
    const shiftX = anchorX - COLUMN_X.page;
    const shiftY = anchorY - (laneCenter - SIZE.page.height / 2);

    const pageNode: PageNode = {
      id: `page:${page.id}`,
      kind: "page",
      pageId: page.id,
      x: anchorX,
      y: anchorY,
      ...SIZE.page,
      title: page.title,
      index: index + 1,
      status: page.status,
      versionLabel: current?.label ?? null,
      thumbnailUrl: current?.assets.desktop ?? current?.assets.tablet ?? current?.assets.mobile ?? null,
      openCount: page.openCount,
      blockingCount: page.blockingCount,
    };
    nodes.push(pageNode);

    // ── Les appareils ────────────────────────────────────────────────
    const deviceIds: string[] = [];
    devices.forEach((device, row) => {
      const id = `device:${page.id}:${device}`;
      deviceIds.push(id);
      nodes.push({
        id,
        kind: "device",
        pageId: page.id,
        x: COLUMN_X.device + shiftX,
        y: laneTop + row * DEVICE_ROW + shiftY,
        ...SIZE.device,
        device,
        hasAsset: true,
      });
      edges.push({ id: `${pageNode.id}->${id}`, source: pageNode.id, target: id, pageId: page.id });
    });

    // ── Les retours ──────────────────────────────────────────────────
    //
    // Le nœud n'apparaît que s'il y a quelque chose à dire. Un nœud
    // « 0 commentaire » sur chaque page remplirait la carte de vide.
    const totalComments = page.commentCount;
    let tail = pageNode.id;
    if (deviceIds.length > 0) tail = deviceIds[deviceIds.length - 1];

    if (totalComments > 0) {
      const id = `feedback:${page.id}`;
      nodes.push({
        id,
        kind: "feedback",
        pageId: page.id,
        x: COLUMN_X.feedback + shiftX,
        y: laneCenter - SIZE.feedback.height / 2 + shiftY,
        ...SIZE.feedback,
        total: totalComments,
        pending: page.openCount,
      });
      // Chaque appareil mène aux retours : un retour porte un appareil
      // (design_comments.device), donc le lien dit vrai.
      const sources = deviceIds.length > 0 ? deviceIds : [pageNode.id];
      for (const source of sources) {
        edges.push({ id: `${source}->${id}`, source, target: id, pageId: page.id });
      }
      tail = id;
    }

    // ── Les révisions ────────────────────────────────────────────────
    //
    // Une révision est en cours si une version postérieure à celle qui
    // est publiée existe déjà, ou si le client a demandé des
    // modifications sans que KOV ait encore publié.
    const draft = findDraftAfterCurrent(page, current?.number ?? 0);
    if (draft || page.status === "changes_requested") {
      const id = `revision:${page.id}`;
      nodes.push({
        id,
        kind: "revision",
        pageId: page.id,
        x: COLUMN_X.revision + shiftX,
        y: laneCenter - SIZE.revision.height / 2 + shiftY,
        ...SIZE.revision,
        draftLabel: draft?.label ?? null,
      });
      edges.push({ id: `${tail}->${id}`, source: tail, target: id, pageId: page.id });
      tail = id;
    }

    edges.push({ id: `${tail}->approval`, source: tail, target: "approval", pageId: page.id });

    cursorY = laneTop + laneHeight + LANE_GAP;
  });

  // ── La validation finale ─────────────────────────────────────────────
  //
  // Un seul nœud pour tout le projet, centré sur l'ensemble des couloirs.
  // Il existe même quand rien n'est validé : c'est la destination, et une
  // carte qui ne montre pas sa destination ne raconte pas de trajet.
  const totalPages = board.pages.length;
  const centerY = laneCenters.length > 0 ? laneCenters.reduce((a, b) => a + b, 0) / laneCenters.length : 0;

  nodes.push({
    id: "approval",
    kind: "approval",
    pageId: null,
    x: COLUMN_X.approval,
    y: centerY - SIZE.approval.height / 2,
    ...SIZE.approval,
    ready: board.canApproveAll,
    approvedPages: board.tally.approvedPages,
    totalPages,
  });

  const maxX = Math.max(...nodes.map((n) => n.x + n.width), 0);
  const maxY = Math.max(...nodes.map((n) => n.y + n.height), 0);
  const minY = Math.min(...nodes.map((n) => n.y), 0);

  return { nodes, edges, bounds: { width: maxX, height: maxY - minY } };
}

function findDraftAfterCurrent(page: DesignPage, currentNumber: number) {
  return page.versions.find((v) => v.number > currentNumber && v.status === "draft") ?? null;
}
