import { BLOCK_SPANS, blocksFor, type BlockSpan, type DashboardSurface } from "./blocks";

// Fusionner ce qui est enregistré avec ce que le code propose.
//
// C'est la seule fonction qui décide de ce qui s'affiche, et elle est
// écrite pour ne jamais échouer : un arrangement enregistré est une
// donnée ancienne, produite par une version du code qui n'est plus la
// nôtre.
//
//   — une entrée dont le bloc n'existe plus est ignorée ;
//   — un bloc absent de l'arrangement est ajouté à la fin, à sa taille
//     par défaut ;
//   — une largeur inconnue retombe sur le défaut ;
//   — un bloc obligatoire ne peut pas rester masqué.
//
// Autrement dit : livrer un nouveau bloc, en retirer un, ou changer une
// taille par défaut ne casse l'écran de personne.

export interface BlockPlacement {
  id: string;
  span: BlockSpan;
  hidden: boolean;
}

export interface ResolvedBlock extends BlockPlacement {
  label: string;
  required: boolean;
}

function asSpan(value: unknown, fallback: BlockSpan): BlockSpan {
  return (BLOCK_SPANS as readonly number[]).includes(value as number) ? (value as BlockSpan) : fallback;
}

/** Ce qui sort de la base est du JSON arbitraire : il est lu champ par
 *  champ, jamais fait confiance en bloc. */
export function parseStoredLayout(raw: unknown): BlockPlacement[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: BlockPlacement[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : null;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      // La taille par défaut n'est pas connue ici ; resolveLayout la
      // rétablit. 12 n'est qu'une valeur de passage.
      span: asSpan(record.span, 12),
      hidden: record.hidden === true,
    });
  }
  return out;
}

export function resolveLayout(surface: DashboardSurface, stored: BlockPlacement[]): ResolvedBlock[] {
  const definitions = blocksFor(surface);
  const byId = new Map(definitions.map((definition) => [definition.id, definition]));
  const placed = new Map(stored.map((entry) => [entry.id, entry]));

  const ordered: ResolvedBlock[] = [];
  const used = new Set<string>();

  // D'abord l'ordre enregistré, en sautant ce qui n'existe plus.
  for (const entry of stored) {
    const definition = byId.get(entry.id);
    if (!definition) continue;
    used.add(entry.id);
    ordered.push({
      id: definition.id,
      label: definition.label,
      required: definition.required === true,
      span: asSpan(entry.span, definition.defaultSpan),
      hidden: definition.required === true ? false : entry.hidden,
    });
  }

  // Puis ce que l'arrangement ne connaissait pas, dans l'ordre du code.
  for (const definition of definitions) {
    if (used.has(definition.id)) continue;
    const entry = placed.get(definition.id);
    ordered.push({
      id: definition.id,
      label: definition.label,
      required: definition.required === true,
      span: asSpan(entry?.span, definition.defaultSpan),
      hidden: definition.required === true ? false : (entry?.hidden ?? false),
    });
  }

  return ordered;
}

/** L'arrangement par défaut : celui du code, sans rien d'enregistré. */
export function defaultLayout(surface: DashboardSurface): ResolvedBlock[] {
  return resolveLayout(surface, []);
}

/** Ce qui part en base. On n'écrit que les trois champs utiles — le
 *  libellé et le caractère obligatoire appartiennent au code et
 *  changeraient sans que la ligne le sache. */
export function toStorable(blocks: ResolvedBlock[]): BlockPlacement[] {
  return blocks.map((block) => ({ id: block.id, span: block.span, hidden: block.hidden }));
}

/** Vrai quand l'arrangement ne dit rien de plus que le défaut — auquel cas
 *  on efface la ligne au lieu d'enregistrer une copie du code. */
export function matchesDefault(surface: DashboardSurface, blocks: ResolvedBlock[]): boolean {
  const reference = defaultLayout(surface);
  if (reference.length !== blocks.length) return false;
  return reference.every(
    (block, index) =>
      block.id === blocks[index].id && block.span === blocks[index].span && block.hidden === blocks[index].hidden
  );
}

// ── LES CLASSES DE GRILLE ────────────────────────────────────────────
//
// Tailwind ne génère que les classes qu'il lit dans le source : une
// classe construite à l'exécution (`xl:col-span-${span}`) n'existerait
// pas dans la feuille produite. D'où cette table, écrite en toutes
// lettres.
//
// Sous md tout occupe la largeur : une carte d'un quart de large sur un
// téléphone est illisible, quel que soit le choix de son propriétaire.
export const SPAN_CLASS: Record<BlockSpan, string> = {
  3: "col-span-12 md:col-span-6 xl:col-span-3",
  4: "col-span-12 md:col-span-6 xl:col-span-4",
  6: "col-span-12 md:col-span-6 xl:col-span-6",
  8: "col-span-12 md:col-span-12 xl:col-span-8",
  12: "col-span-12",
};
