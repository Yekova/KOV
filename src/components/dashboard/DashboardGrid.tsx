"use client";

import { useMemo, useRef, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { toast } from "sonner";
import { GRID_COLUMNS, GRID_GAP, ROW_HEIGHT, type DashboardSurface } from "@/lib/dashboard/blocks";
import { normalise, type ResolvedBlock } from "@/lib/dashboard/layout";
import { resetDashboardLayout, saveDashboardLayout } from "@/lib/dashboard/actions";
import "./dashboardGrid.css";

// Le tableau de bord, arrangé à la main.
//
// ── POURQUOI LES BLOCS ARRIVENT EN PROPS ET NON EN ENFANTS ───────────
//
// La page reste un composant serveur : elle interroge la base, compose
// ses cartes, et les passe ici déjà rendues, indexées par identifiant.
// React réordonne des nœuds ; il n'a pas besoin de savoir les produire.
// Rien de la page n'a migré côté navigateur — seul l'arrangement l'est.
//
// ── LE GESTE ─────────────────────────────────────────────────────────
//
// Tout passe par la capture de pointeur : au premier appui on capture, et
// les déplacements arrivent ensuite sur le même élément même si le doigt
// sort de la carte. Pas d'écouteur posé sur window, donc rien à retirer,
// et rien qui survive à un démontage en cours de geste.
//
// Ni effet ni écriture d'état pendant le rendu : le compilateur React les
// refuse, et il a raison — un état recopié depuis les props écraserait la
// carte qu'on est en train de tenir.

interface Interaction {
  id: string;
  mode: "move" | "resize";
  pointerX: number;
  pointerY: number;
  origin: { x: number; y: number; w: number; h: number };
  cellWidth: number;
}

/** La hauteur, en pixels, d'un bloc de `h` rangées. */
function pixelHeight(h: number): number {
  return h * ROW_HEIGHT + (h - 1) * GRID_GAP;
}

/** Le nombre de rangées nécessaires pour `px` pixels de contenu. */
function rowsFor(px: number): number {
  return Math.max(1, Math.ceil((px + GRID_GAP) / (ROW_HEIGHT + GRID_GAP)));
}

export function DashboardGrid({
  surface,
  initialLayout,
  blocks,
}: {
  surface: DashboardSurface;
  initialLayout: ResolvedBlock[];
  /** Les blocs déjà rendus, par identifiant. Une valeur absente veut dire
   *  « pas de donnée pour ce bloc aujourd'hui » : il n'est ni affiché ni
   *  proposé, mais sa place reste enregistrée pour le jour où la donnée
   *  revient. */
  blocks: Partial<Record<string, ReactNode>>;
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [draft, setDraft] = useState<ResolvedBlock[] | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [pending, startTransition] = useTransition();

  const gridRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef(new Map<string, HTMLDivElement>());

  const editing = draft !== null;
  const current = draft ?? layout;

  const available = useMemo(() => current.filter((block) => blocks[block.id] != null), [current, blocks]);
  // L'ordre du DOM suit (y, x) : c'est lui qui fait l'empilement sous
  // 1280 px, où la grille se replie sur une colonne.
  const shown = useMemo(
    () => (editing ? available : available.filter((block) => !block.hidden)).sort((a, b) => a.y - b.y || a.x - b.x),
    [available, editing]
  );

  function cellWidth(): number {
    const width = gridRef.current?.getBoundingClientRect().width ?? 0;
    return (width - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS;
  }

  function begin(event: React.PointerEvent, block: ResolvedBlock, mode: "move" | "resize") {
    if (!editing) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    setInteraction({
      id: block.id,
      mode,
      pointerX: event.clientX,
      pointerY: event.clientY,
      origin: { x: block.x, y: block.y, w: block.w, h: block.h },
      cellWidth: cellWidth(),
    });
  }

  function drag(event: React.PointerEvent) {
    if (!interaction) return;
    const { origin, cellWidth: cw, mode, id } = interaction;
    const stepX = Math.round((event.clientX - interaction.pointerX) / (cw + GRID_GAP));
    const stepY = Math.round((event.clientY - interaction.pointerY) / (ROW_HEIGHT + GRID_GAP));

    setDraft((previous) => {
      const list = previous ?? layout;
      const target = list.find((block) => block.id === id);
      if (!target) return list;

      const moved =
        mode === "move"
          ? {
              ...target,
              x: Math.max(0, Math.min(origin.x + stepX, GRID_COLUMNS - target.w)),
              y: Math.max(0, origin.y + stepY),
            }
          : {
              ...target,
              w: Math.max(target.minW, Math.min(origin.w + stepX, GRID_COLUMNS - target.x)),
              h: Math.max(target.minH, origin.h + stepY),
            };

      // La carte qu'on tient garde sa position exacte ; les autres
      // s'écartent. C'est ce qui donne l'impression que ça s'emboîte.
      return normalise(
        list.map((block) => (block.id === id ? moved : block)),
        id
      );
    });
  }

  function end(event: React.PointerEvent) {
    if (!interaction) return;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    setInteraction(null);
    setDraft((previous) => (previous ? normalise(previous) : previous));
  }

  /**
   * Ajuster chaque hauteur à ce que la carte contient vraiment.
   *
   * C'est la réponse au « ça ne s'emboîte pas » : une hauteur écrite à
   * l'avance est une estimation, alors que le navigateur, lui, connaît la
   * hauteur réelle. On la lit et on arrondit à la rangée supérieure.
   */
  function fitHeights() {
    setDraft((previous) => {
      const list = previous ?? layout;
      const next = list.map((block) => {
        const element = contentRefs.current.get(block.id);
        if (!element) return block;
        const measured = rowsFor(element.scrollHeight);
        return { ...block, h: Math.max(block.minH, measured) };
      });
      return normalise(next);
    });
    toast.success("Hauteurs ajustées au contenu.");
  }

  function patch(id: string, change: Partial<ResolvedBlock>) {
    setDraft((previous) => normalise((previous ?? layout).map((b) => (b.id === id ? { ...b, ...change } : b))));
  }

  function nudge(id: string, dx: number, dy: number, mode: "move" | "resize") {
    setDraft((previous) => {
      const list = previous ?? layout;
      const target = list.find((block) => block.id === id);
      if (!target) return list;
      const moved =
        mode === "move"
          ? { ...target, x: Math.max(0, Math.min(target.x + dx, GRID_COLUMNS - target.w)), y: Math.max(0, target.y + dy) }
          : {
              ...target,
              w: Math.max(target.minW, Math.min(target.w + dx, GRID_COLUMNS - target.x)),
              h: Math.max(target.minH, target.h + dy),
            };
      return normalise(
        list.map((block) => (block.id === id ? moved : block)),
        id
      );
    });
  }

  function save() {
    const next = draft ?? layout;
    startTransition(async () => {
      const result = await saveDashboardLayout(surface, next);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setLayout(next);
      setDraft(null);
      toast.success("Tableau de bord enregistré.");
    });
  }

  function reset() {
    startTransition(async () => {
      const result = await resetDashboardLayout(surface);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDraft(null);
      toast.success("Disposition d'origine rétablie.");
    });
  }

  return (
    <div className="kov-dash" data-editing={editing || undefined}>
      <div className="kov-dash__toolbar">
        {!editing ? (
          <button type="button" onClick={() => setDraft(layout)} className="kov-dash__cta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 6h16M4 12h10M4 18h7" />
            </svg>
            Personnaliser
          </button>
        ) : (
          <>
            <p className="kov-dash__hint">
              Tirez une carte pour la déplacer, son coin bas-droit pour la redimensionner. Au clavier&nbsp;: flèches pour
              déplacer, Maj&nbsp;+&nbsp;flèches pour redimensionner.
            </p>
            <div className="kov-dash__actions">
              <button type="button" onClick={fitHeights} disabled={pending} className="kov-dash__ghost">
                Ajuster les hauteurs
              </button>
              <button type="button" onClick={reset} disabled={pending} className="kov-dash__ghost">
                Disposition d&apos;origine
              </button>
              <button type="button" onClick={() => setDraft(null)} disabled={pending} className="kov-dash__outline">
                Annuler
              </button>
              <button type="button" onClick={save} disabled={pending} className="kov-dash__cta kov-dash__cta--solid">
                {pending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </>
        )}
      </div>

      <div
        ref={gridRef}
        className="kov-dash__grid"
        style={
          {
            "--kov-dash-cols": GRID_COLUMNS,
            "--kov-dash-row": `${ROW_HEIGHT}px`,
            "--kov-dash-gap": `${GRID_GAP}px`,
          } as CSSProperties
        }
      >
        {shown.map((block) => (
          <section
            key={block.id}
            className="kov-dash__item"
            data-hidden={editing && block.hidden ? true : undefined}
            data-active={interaction?.id === block.id || undefined}
            style={
              {
                "--bx": block.x + 1,
                "--by": block.y + 1,
                "--bw": block.w,
                "--bh": block.h,
                // Sous 1280 px la grille se replie et la hauteur redevient
                // celle du contenu : une carte de trois rangées sur un
                // téléphone couperait son propre texte.
                "--bpx": `${pixelHeight(block.h)}px`,
              } as CSSProperties
            }
            aria-label={editing ? block.label : undefined}
          >
            {editing && (
              <>
                <div
                  className="kov-dash__bar"
                  onPointerDown={(event) => begin(event, block, "move")}
                  onPointerMove={drag}
                  onPointerUp={end}
                  onPointerCancel={end}
                >
                  <span className="kov-dash__grip" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="6" r="1.6" />
                      <circle cx="15" cy="6" r="1.6" />
                      <circle cx="9" cy="12" r="1.6" />
                      <circle cx="15" cy="12" r="1.6" />
                      <circle cx="9" cy="18" r="1.6" />
                      <circle cx="15" cy="18" r="1.6" />
                    </svg>
                  </span>

                  {/* Le bouton porte le déplacement au clavier : tirer une
                      carte est le geste attendu, il ne peut pas être le
                      seul chemin. */}
                  <button
                    type="button"
                    className="kov-dash__name"
                    onKeyDown={(event) => {
                      const map: Record<string, [number, number]> = {
                        ArrowLeft: [-1, 0],
                        ArrowRight: [1, 0],
                        ArrowUp: [0, -1],
                        ArrowDown: [0, 1],
                      };
                      const delta = map[event.key];
                      if (!delta) return;
                      event.preventDefault();
                      nudge(block.id, delta[0], delta[1], event.shiftKey ? "resize" : "move");
                    }}
                  >
                    {block.label}
                  </button>

                  <span className="kov-dash__dims" aria-hidden="true">
                    {block.w}&times;{block.h}
                  </span>

                  {!block.required && (
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => patch(block.id, { hidden: !block.hidden })}
                      className="kov-dash__toggle"
                    >
                      {block.hidden ? "Afficher" : "Masquer"}
                    </button>
                  )}
                </div>

                <span
                  className="kov-dash__resize"
                  role="presentation"
                  onPointerDown={(event) => begin(event, block, "resize")}
                  onPointerMove={drag}
                  onPointerUp={end}
                  onPointerCancel={end}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <path d="M11 4 4 11M11 8l-3 3" />
                  </svg>
                </span>
              </>
            )}

            <div
              className="kov-dash__content"
              ref={(element) => {
                if (element) contentRefs.current.set(block.id, element);
                else contentRefs.current.delete(block.id);
              }}
            >
              {blocks[block.id]}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
