import { blocksFor, GRID_COLUMNS, type DashboardSurface } from "./blocks.ts";

// Placer les blocs, et résoudre ce qui se chevauche.
//
// ── LE MODÈLE ────────────────────────────────────────────────────────
//
// Chaque bloc porte x, y, w, h en unités de grille — douze colonnes, des
// rangées de hauteur fixe. C'est le modèle de tous les constructeurs de
// tableaux de bord, et il a une propriété que le placement en pixels n'a
// pas : il se replie. Sous 1280 px, x et w sont ignorés et les blocs
// s'empilent dans l'ordre (y, x), pleine largeur. Une carte posée « à
// droite » ne sort donc jamais de l'écran d'un portable.
//
// ── POURQUOI UNE RÉSOLUTION, ET PAS UNE INTERDICTION ─────────────────
//
// Empêcher un chevauchement pendant qu'on déplace une carte oblige à
// refuser le geste, donc à immobiliser la carte sous le curseur. On
// accepte plutôt le geste et on pousse les autres : celle qu'on tient va
// exactement où on la met, les voisines s'écartent. C'est ce que
// « s'emboîter » veut dire quand on le fait à la main.

export interface BlockPlacement {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hidden: boolean;
}

export interface ResolvedBlock extends BlockPlacement {
  label: string;
  required: boolean;
  minW: number;
  minH: number;
}

export function collides(a: BlockPlacement, b: BlockPlacement): boolean {
  return (
    a.id !== b.id &&
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/** La première place libre en balayant de gauche à droite, de haut en
 *  bas. Sert à poser les blocs par défaut et à accueillir un bloc que
 *  l'arrangement enregistré ne connaissait pas. */
function findSpot(placed: BlockPlacement[], w: number, h: number): { x: number; y: number } {
  for (let y = 0; y < 400; y += 1) {
    for (let x = 0; x + w <= GRID_COLUMNS; x += 1) {
      const probe: BlockPlacement = { id: "__probe", x, y, w, h, hidden: false };
      if (!placed.some((other) => collides(probe, other))) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

/**
 * Remettre tout le monde d'aplomb.
 *
 * `priorityId` est le bloc que l'on tient : il garde sa position exacte
 * et n'est jamais remonté. Les autres sont poussés vers le bas tant
 * qu'ils chevauchent, puis remontés tant qu'ils le peuvent — ce qui
 * referme les trous laissés par un bloc qu'on vient de déplacer.
 */
export function normalise<T extends BlockPlacement>(blocks: T[], priorityId: string | null = null): T[] {
  const order = [...blocks].sort((a, b) => {
    if (a.id === priorityId) return -1;
    if (b.id === priorityId) return 1;
    return a.y - b.y || a.x - b.x;
  });

  const placed: T[] = [];
  for (const block of order) {
    const item = { ...block, x: Math.max(0, Math.min(block.x, GRID_COLUMNS - block.w)) };

    if (item.id === priorityId) {
      placed.push(item);
      continue;
    }

    // Pousser vers le bas jusqu'à ce que la place soit libre. La borne
    // n'est pas de la prudence décorative : une erreur de largeur
    // rendrait la boucle infinie et figerait l'onglet.
    let guard = 0;
    while (placed.some((other) => collides(item, other)) && guard < 500) {
      item.y += 1;
      guard += 1;
    }

    // Puis remonter tant que c'est libre : sans ça, déplacer une carte
    // vers le bas laisserait un trou là où elle était.
    while (item.y > 0) {
      const lifted = { ...item, y: item.y - 1 };
      if (placed.some((other) => collides(lifted, other))) break;
      item.y -= 1;
    }

    placed.push(item);
  }

  return placed;
}

function toInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

/** Ce qui sort de la base est du JSON arbitraire : lu champ par champ,
 *  jamais accepté en bloc. Une entrée illisible est ignorée, pas
 *  refusée — un arrangement enregistré vient d'une version du code qui
 *  n'est plus la nôtre. */
export function parseStoredLayout(raw: unknown): Partial<BlockPlacement>[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Partial<BlockPlacement>[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : null;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      x: record.x === undefined ? undefined : toInt(record.x, 0),
      y: record.y === undefined ? undefined : toInt(record.y, 0),
      // `span` est la forme de la première version de cet écran, qui ne
      // connaissait que la largeur. Elle est relue plutôt que jetée.
      w: record.w === undefined ? (record.span === undefined ? undefined : toInt(record.span, 4)) : toInt(record.w, 4),
      h: record.h === undefined ? undefined : toInt(record.h, 4),
      hidden: record.hidden === true,
    });
  }
  return out;
}

export function resolveLayout(surface: DashboardSurface, stored: Partial<BlockPlacement>[]): ResolvedBlock[] {
  const definitions = blocksFor(surface);
  const byId = new Map(definitions.map((definition) => [definition.id, definition]));
  const placedById = new Map(stored.map((entry) => [entry.id as string, entry]));

  // L'ordre enregistré d'abord, ce que le code ajoute ensuite : un bloc
  // nouveau se pose après les autres, jamais au milieu de ce que
  // quelqu'un a arrangé.
  const orderedIds = [
    ...stored.map((entry) => entry.id as string).filter((id) => byId.has(id)),
    ...definitions.map((definition) => definition.id).filter((id) => !placedById.has(id)),
  ];

  const result: ResolvedBlock[] = [];
  for (const id of orderedIds) {
    const definition = byId.get(id)!;
    const entry = placedById.get(id);

    const minW = definition.minW ?? 2;
    const minH = definition.minH ?? 2;
    const w = Math.min(GRID_COLUMNS, Math.max(minW, entry?.w ?? definition.defaultW));
    const h = Math.max(minH, entry?.h ?? definition.defaultH);

    // Une position absente — bloc jamais arrangé, ou tout nouveau — est
    // calculée, pas devinée : la première place libre.
    const spot =
      entry?.x !== undefined && entry?.y !== undefined
        ? { x: Math.max(0, Math.min(entry.x, GRID_COLUMNS - w)), y: Math.max(0, entry.y) }
        : findSpot(result, w, h);

    result.push({
      id,
      label: definition.label,
      required: definition.required === true,
      minW,
      minH,
      w,
      h,
      x: spot.x,
      y: spot.y,
      hidden: definition.required === true ? false : (entry?.hidden ?? false),
    });
  }

  return normalise(result);
}

export function defaultLayout(surface: DashboardSurface): ResolvedBlock[] {
  return resolveLayout(surface, []);
}

/** Ce qui part en base. Le libellé et les minimums appartiennent au code
 *  et changeraient sans que la ligne le sache. */
export function toStorable(blocks: ResolvedBlock[]): BlockPlacement[] {
  return blocks.map(({ id, x, y, w, h, hidden }) => ({ id, x, y, w, h, hidden }));
}

/** Vrai quand l'arrangement ne dit rien de plus que le défaut — auquel
 *  cas la ligne est effacée au lieu d'enregistrer une copie du code. */
export function matchesDefault(surface: DashboardSurface, blocks: ResolvedBlock[]): boolean {
  const reference = defaultLayout(surface);
  if (reference.length !== blocks.length) return false;
  return reference.every((block, index) => {
    const other = blocks[index];
    return (
      block.id === other.id &&
      block.x === other.x &&
      block.y === other.y &&
      block.w === other.w &&
      block.h === other.h &&
      block.hidden === other.hidden
    );
  });
}
