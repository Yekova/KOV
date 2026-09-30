"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { BLOCK_SPANS, SPAN_LABELS, type BlockSpan, type DashboardSurface } from "@/lib/dashboard/blocks";
import { SPAN_CLASS, type ResolvedBlock } from "@/lib/dashboard/layout";
import { resetDashboardLayout, saveDashboardLayout } from "@/lib/dashboard/actions";
import "./dashboardGrid.css";

// Le tableau de bord, arrangeable.
//
// ── POURQUOI LES BLOCS ARRIVENT EN PROPS ET NON EN ENFANTS ───────────
//
// La page reste un composant serveur : elle interroge la base, compose
// ses cartes, et les passe ici déjà rendues, indexées par identifiant.
// React peut réordonner des nœuds déjà rendus ; il n'a pas besoin de
// savoir les produire. Rien de la page n'a donc migré côté navigateur —
// seul l'arrangement l'est.
//
// ── POURQUOI PAS UNE GRILLE LIBRE ────────────────────────────────────
//
// Un placement libre en deux dimensions demande une position x/y par
// bloc, et cette position ne veut plus rien dire dès que la fenêtre
// change de largeur : sur un portable, une carte posée « à droite » se
// retrouve sous une autre, ou hors de l'écran. L'ordre plus la largeur
// disent la même chose et survivent au redimensionnement — c'est aussi
// ce qui permet de tout replier proprement sur un téléphone.

export function DashboardGrid({
  surface,
  initialLayout,
  blocks,
}: {
  surface: DashboardSurface;
  initialLayout: ResolvedBlock[];
  /** Les blocs déjà rendus, par identifiant. Une valeur absente veut dire
   *  « pas de donnée pour ce bloc aujourd'hui » : il n'est alors ni
   *  affiché ni proposé dans l'éditeur, mais sa place reste enregistrée
   *  pour le jour où la donnée revient. */
  blocks: Partial<Record<string, ReactNode>>;
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [draft, setDraft] = useState<ResolvedBlock[] | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editing = draft !== null;
  const current = draft ?? layout;

  // Un bloc sans contenu n'existe pas pour cet écran aujourd'hui.
  const available = useMemo(() => current.filter((block) => blocks[block.id] != null), [current, blocks]);
  const visible = useMemo(() => available.filter((block) => !block.hidden), [available]);

  function move(id: string, direction: -1 | 1) {
    setDraft((previous) => {
      const list = [...(previous ?? layout)];
      const from = list.findIndex((block) => block.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= list.length) return list;
      [list[from], list[to]] = [list[to], list[from]];
      return list;
    });
  }

  function dropOn(targetId: string) {
    if (!dragging || dragging === targetId) return;
    setDraft((previous) => {
      const list = [...(previous ?? layout)];
      const from = list.findIndex((block) => block.id === dragging);
      const to = list.findIndex((block) => block.id === targetId);
      if (from < 0 || to < 0) return list;
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return list;
    });
    setDragging(null);
  }

  function patch(id: string, change: Partial<ResolvedBlock>) {
    setDraft((previous) =>
      (previous ?? layout).map((block) => (block.id === id ? { ...block, ...change } : block))
    );
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
      // La page se revalide et renverra l'arrangement par défaut ; on
      // sort du mode édition pour ne pas réécrire par-dessus.
      setDraft(null);
      toast.success("Disposition d'origine rétablie.");
    });
  }

  return (
    <div className="kov-dash">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {!editing ? (
          <button
            type="button"
            onClick={() => setDraft(layout)}
            className="text-kov-concrete hover:border-kov-red hover:text-kov-red ml-auto inline-flex h-9 items-center gap-2 border px-4 text-[11px] tracking-widest uppercase transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 6h16M4 12h10M4 18h7" />
            </svg>
            Personnaliser
          </button>
        ) : (
          <>
            <p className="text-kov-concrete text-[11px]">
              Glissez une carte pour la déplacer, ou utilisez les flèches. La largeur se choisit carte par carte.
            </p>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={pending}
                className="text-kov-concrete hover:text-kov-red h-9 px-3 text-[11px] tracking-widest uppercase transition-colors disabled:opacity-50"
              >
                Disposition d&apos;origine
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                disabled={pending}
                className="text-kov-bone hover:border-kov-red hover:text-kov-red inline-flex h-9 items-center border px-4 text-[11px] tracking-widest uppercase transition-colors disabled:opacity-50"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="text-kov-white hover:bg-kov-red-signal inline-flex h-9 items-center px-4 text-[11px] tracking-widest uppercase transition-colors disabled:opacity-50"
                style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
              >
                {pending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4 xl:gap-6">
        {(editing ? available : visible).map((block, index) => (
          <section
            key={block.id}
            className={`kov-dash__block ${SPAN_CLASS[block.span]}`}
            data-editing={editing || undefined}
            data-hidden={editing && block.hidden ? true : undefined}
            data-dragging={dragging === block.id || undefined}
            draggable={editing}
            onDragStart={() => setDragging(block.id)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(event) => editing && event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              dropOn(block.id);
            }}
            aria-label={editing ? block.label : undefined}
          >
            {editing && (
              <BlockToolbar
                block={block}
                first={index === 0}
                last={index === available.length - 1}
                onMove={move}
                onPatch={patch}
              />
            )}
            <div className="kov-dash__content">{blocks[block.id]}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

function BlockToolbar({
  block,
  first,
  last,
  onMove,
  onPatch,
}: {
  block: ResolvedBlock;
  first: boolean;
  last: boolean;
  onMove: (id: string, direction: -1 | 1) => void;
  onPatch: (id: string, change: Partial<ResolvedBlock>) => void;
}) {
  return (
    <div className="kov-dash__bar">
      {/* Le glissement est le geste attendu, mais il ne peut pas être le
          seul : les deux flèches font la même chose au clavier, et une
          souris qui tremble n'a pas à recommencer trois fois. */}
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

      <span className="kov-dash__name">{block.label}</span>

      <button
        type="button"
        onClick={() => onMove(block.id, -1)}
        disabled={first}
        className="kov-dash__icon"
        aria-label={`Déplacer « ${block.label} » vers le haut`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onMove(block.id, 1)}
        disabled={last}
        className="kov-dash__icon"
        aria-label={`Déplacer « ${block.label} » vers le bas`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <label className="kov-dash__size">
        <span className="sr-only">Largeur de « {block.label} »</span>
        <select
          value={block.span}
          onChange={(event) => onPatch(block.id, { span: Number(event.target.value) as BlockSpan })}
        >
          {BLOCK_SPANS.map((span) => (
            <option key={span} value={span}>
              {SPAN_LABELS[span]}
            </option>
          ))}
        </select>
      </label>

      {/* Un bloc obligatoire n'offre pas le bouton plutôt que de le
          proposer désactivé : une commande grisée pose une question à
          laquelle elle refuse de répondre. */}
      {!block.required && (
        <button
          type="button"
          onClick={() => onPatch(block.id, { hidden: !block.hidden })}
          className="kov-dash__toggle"
        >
          {block.hidden ? "Afficher" : "Masquer"}
        </button>
      )}
    </div>
  );
}
