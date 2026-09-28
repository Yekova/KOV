"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { formatMoneyPrecise } from "@/lib/pricing/money";
import { getClientBillingPdfUrl, downloadBillingDocument } from "@/app/client/invoices/actions";
import type { BillingDocument } from "@/lib/portal/billing";

// Le tableau des devis et factures, et le panneau qui montre le document
// choisi.
//
// Un tableau plutôt que des cartes, contrairement aux projets : un devis et
// une facture ont exactement les mêmes attributs — une référence, un
// projet, une date, un montant, un statut, une échéance. C'est une liste
// qu'on compare, et une liste qu'on compare se lit en colonnes alignées.
//
// ── L'ONGLET PAR DÉFAUT N'EST PAS « TOUS » ────────────────────────────
//
// C'est « À traiter ». Ouvrir cet écran, c'est demander ce qu'on doit
// signer ou régler ; l'historique se consulte, il ne s'impose pas. Et
// l'onglet disparaît quand il est vide plutôt que de rester là à dire
// zéro — un onglet permanent qui affiche zéro apprend à ne plus être lu.

type TabId = "todo" | "all" | "quotes" | "invoices" | "paid" | "archived";

const TAB_LABELS: Record<TabId, string> = {
  todo: "À traiter",
  all: "Tous",
  quotes: "Devis",
  invoices: "Factures",
  paid: "Réglées",
  archived: "Archives",
};

const TAB_ORDER: TabId[] = ["todo", "all", "quotes", "invoices", "paid", "archived"];

function matchesTab(document: BillingDocument, tab: TabId): boolean {
  switch (tab) {
    case "todo":
      return document.actionable;
    case "all":
      // Les archives sont exclues de « Tous » : un devis refusé il y a un an
      // n'a pas à encombrer la vue par défaut, et il a son propre onglet.
      return !document.archived;
    case "quotes":
      return document.kind === "quote" && !document.archived;
    case "invoices":
      return document.kind === "invoice" && !document.archived;
    case "paid":
      return document.kind === "invoice" && document.status === "paid";
    case "archived":
      return document.archived;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function dueHint(document: BillingDocument): string | null {
  if (document.dueInDays === null) return null;
  if (document.dueInDays < 0) return `il y a ${Math.abs(document.dueInDays)} j`;
  if (document.dueInDays === 0) return "aujourd'hui";
  return `dans ${document.dueInDays} j`;
}

export function BillingWorkspace({ documents }: { documents: BillingDocument[] }) {
  const [tab, setTab] = useState<TabId>(documents.some((d) => d.actionable) ? "todo" : "all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result = {} as Record<TabId, number>;
    for (const id of TAB_ORDER) result[id] = documents.filter((document) => matchesTab(document, id)).length;
    return result;
  }, [documents]);

  const visible = useMemo(() => {
    let rows = documents.filter((document) => matchesTab(document, tab));
    const needle = query.trim().toLowerCase();
    if (needle) {
      rows = rows.filter((document) =>
        [document.reference, document.projectName, document.statusLabel, document.kindLabel]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(needle))
      );
    }
    return rows;
  }, [documents, tab, query]);

  const selected = visible.find((document) => document.id === selectedId) ?? visible[0] ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {TAB_ORDER.filter((id) => counts[id] > 0 || id === "all").map((id) => {
              const isActive = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-pressed={isActive}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-widest transition-colors"
                  style={{
                    borderRadius: "var(--radius-pill)",
                    border: `1px solid ${isActive ? "rgba(227,30,36,0.5)" : "var(--kov-border)"}`,
                    color: isActive ? "var(--kov-bone)" : "var(--kov-concrete)",
                    background: isActive ? "rgba(227,30,36,0.1)" : "transparent",
                  }}
                >
                  {TAB_LABELS[id]}
                  <span className="text-kov-concrete tabular-nums">{counts[id]}</span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[200px]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-kov-concrete"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Rechercher un document"
              placeholder="Référence, projet…"
              className="w-full border bg-transparent py-2 pl-9 pr-3 text-sm text-kov-bone outline-none transition-colors placeholder:text-kov-concrete/70 focus:border-kov-red"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-kov-concrete">
            {query
              ? `Rien ne correspond à « ${query.trim()} ».`
              : tab === "todo"
                ? "Rien à signer ni à régler. Tout est à jour."
                : "Aucun document dans cet onglet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[54rem] border-collapse text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--kov-border)" }}>
                  <th className="py-3 pr-4 text-left text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                    Type
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                    Référence
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                    Projet
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                    Date
                  </th>
                  <th className="py-3 pr-4 text-right text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                    Montant
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                    Statut
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                    Échéance
                  </th>
                  <th className="py-3 text-right text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((document) => {
                  const isSelected = selected?.id === document.id;
                  return (
                    <tr
                      key={`${document.kind}-${document.id}`}
                      onClick={() => setSelectedId(document.id)}
                      className="cursor-pointer border-b align-middle transition-colors hover:bg-white/[0.02]"
                      style={{
                        borderColor: "var(--kov-border)",
                        background: isSelected ? "rgba(255,255,255,0.03)" : undefined,
                        // La sélection est aussi portée par un filet rouge à
                        // gauche : une ligne distinguée par une seule nuance
                        // de fond ne se voit pas sur un écran mal calibré.
                        boxShadow: isSelected ? "inset 2px 0 0 var(--kov-red)" : undefined,
                      }}
                    >
                      <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-kov-concrete">
                        {document.kind === "quote" ? "Devis" : "Facture"}
                        {document.kindLabel && <span className="block text-[11px]">{document.kindLabel}</span>}
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap text-kov-bone">{document.reference}</td>
                      <td className="max-w-[14rem] py-3.5 pr-4 text-xs text-kov-concrete">
                        {document.projectId ? (
                          <Link
                            href={`/client/projects/${document.projectId}`}
                            onClick={(event) => event.stopPropagation()}
                            className="block truncate transition-colors hover:text-kov-red"
                          >
                            {document.projectName}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-kov-concrete">
                        {formatDate(document.date)}
                      </td>
                      <td className="py-3.5 pr-4 text-right whitespace-nowrap tabular-nums text-kov-bone">
                        {formatMoneyPrecise(document.amountCents, document.currency)}
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        {/* La couleur est doublée par le mot, toujours. */}
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px]"
                          style={{ color: document.statusColor }}
                        >
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: document.statusColor }}
                          />
                          {document.statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-kov-concrete">
                        {document.dueDate ? (
                          <>
                            {formatDate(document.dueDate)}
                            <span
                              className="block text-[11px]"
                              style={{
                                color:
                                  document.dueInDays !== null && document.dueInDays < 0
                                    ? "var(--kov-red)"
                                    : "var(--kov-concrete)",
                              }}
                            >
                              {dueHint(document)}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        {document.kind === "quote" && document.signingUrl && !document.signedAt ? (
                          <a
                            href={document.signingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center px-3 py-2 text-[11px] uppercase tracking-widest text-kov-white transition-colors"
                            style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
                          >
                            Signer →
                          </a>
                        ) : document.hasPdf ? (
                          <form action={downloadBillingDocument} onClick={(event) => event.stopPropagation()}>
                            <input type="hidden" name="kind" value={document.kind} />
                            <input type="hidden" name="id" value={document.id} />
                            <Button type="submit" variant="ghost" aria-label={`Télécharger ${document.reference}`}>
                              ↓
                            </Button>
                          </form>
                        ) : (
                          <span className="text-[11px] text-kov-concrete">PDF à venir</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <SelectedDocument document={selected} />
    </div>
  );
}

// Le panneau du document choisi.
//
// Ce qu'il n'affiche pas, et c'est délibéré : aucune ligne de TVA. La
// colonne n'existe dans aucune des deux tables, et KOV est en franchise
// (art. 293 B du CGI) — une ligne « TVA (20 %) » serait un chiffre inventé
// sur un document qui engage.
function SelectedDocument({ document }: { document: BillingDocument | null }) {
  const [isOpening, startOpening] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!document) {
    return (
      <GlassCard className="flex items-center p-6">
        <p className="text-sm text-kov-concrete">Choisissez un document pour en voir le détail.</p>
      </GlassCard>
    );
  }

  const hasDiscount = (document.discountCents ?? 0) > 0;

  return (
    <GlassCard className="flex h-fit flex-col p-6">
      <p className="mb-4 text-xs uppercase tracking-widest text-kov-concrete">Document sélectionné</p>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg text-kov-bone">{document.reference}</p>
          <p className="mt-0.5 text-xs text-kov-concrete">
            {document.kind === "quote" ? "Devis" : "Facture"}
            {document.kindLabel && ` · ${document.kindLabel}`}
            {document.lineCount > 0 && ` · ${document.lineCount} ligne${document.lineCount > 1 ? "s" : ""}`}
          </p>
        </div>
        <span
          className="shrink-0 px-2.5 py-1 text-[10px] uppercase tracking-widest"
          style={{
            color: document.statusColor,
            border: `1px solid ${document.statusColor}`,
            borderRadius: "var(--radius-pill)",
          }}
        >
          {document.statusLabel}
        </span>
      </div>

      {document.projectId && (
        <Link
          href={`/client/projects/${document.projectId}`}
          className="mt-3 block truncate text-sm text-kov-concrete transition-colors hover:text-kov-red"
        >
          {document.projectName} →
        </Link>
      )}

      <dl className="mt-5 space-y-2 border-t pt-5 text-sm" style={{ borderColor: "var(--kov-border)" }}>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-xs text-kov-concrete">{document.kind === "quote" ? "Émis le" : "Émise le"}</dt>
          <dd className="text-kov-bone">{formatDate(document.date)}</dd>
        </div>
        {document.dueDate && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-kov-concrete">
              {document.kind === "quote" ? "Valable jusqu'au" : "Échéance"}
            </dt>
            <dd className="text-kov-bone">{formatDate(document.dueDate)}</dd>
          </div>
        )}
        {document.signedAt && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-kov-concrete">Signé le</dt>
            <dd className="text-kov-bone">{formatDate(document.signedAt)}</dd>
          </div>
        )}
        {document.paidAt && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-kov-concrete">Réglée le</dt>
            <dd className="text-kov-bone">{formatDate(document.paidAt)}</dd>
          </div>
        )}
      </dl>

      <dl className="mt-5 space-y-2 border-t pt-5 text-sm" style={{ borderColor: "var(--kov-border)" }}>
        {/* Le sous-total et la remise ne sont affichés que pour les devis :
            ce sont les seules colonnes réellement stockées (quotes.
            subtotal_cents et discount_cents). Une facture n'a qu'un
            montant, donc on n'en déduit pas un détail qu'elle n'a pas. */}
        {document.subtotalCents !== null && hasDiscount && (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs text-kov-concrete">Sous-total</dt>
              <dd className="tabular-nums text-kov-bone">
                {formatMoneyPrecise(document.subtotalCents, document.currency)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs text-kov-concrete">Remise</dt>
              <dd className="tabular-nums" style={{ color: "#3FB27F" }}>
                −{formatMoneyPrecise(document.discountCents ?? 0, document.currency)}
              </dd>
            </div>
          </>
        )}
        <div className="flex items-baseline justify-between gap-4 pt-1">
          <dt className="text-sm text-kov-bone">Total</dt>
          <dd className="font-display text-xl tabular-nums text-kov-bone">
            {formatMoneyPrecise(document.amountCents, document.currency)}
          </dd>
        </div>
      </dl>

      <div className="mt-6 space-y-2">
        {document.kind === "quote" && document.signingUrl && !document.signedAt && (
          <a
            href={document.signingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center gap-2 text-xs uppercase tracking-widest text-kov-white transition-colors hover:brightness-110"
            style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
          >
            Signer le devis →
          </a>
        )}

        {document.hasPdf && (
          <>
            <button
              type="button"
              disabled={isOpening}
              onClick={() => {
                setError(null);
                startOpening(async () => {
                  try {
                    const url = await getClientBillingPdfUrl(document.kind, document.id);
                    window.open(url, "_blank", "noopener,noreferrer");
                  } catch (caught) {
                    setError(caught instanceof Error ? caught.message : "L'aperçu a échoué.");
                  }
                });
              }}
              className="flex h-12 w-full items-center justify-center gap-2 border text-xs uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red hover:text-kov-red disabled:opacity-60"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
            >
              {isOpening ? "Ouverture…" : "Voir le PDF"}
            </button>

            <form action={downloadBillingDocument}>
              <input type="hidden" name="kind" value={document.kind} />
              <input type="hidden" name="id" value={document.id} />
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 border text-xs uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red hover:text-kov-red"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
              >
                Télécharger
              </button>
            </form>
          </>
        )}

        <Link
          href="/client/requests"
          className="flex h-12 w-full items-center justify-center gap-2 text-xs uppercase tracking-widest text-kov-concrete transition-colors hover:text-kov-red"
        >
          Une question sur ce document ?
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs" style={{ color: "var(--kov-red)" }}>
          {error}
        </p>
      )}
    </GlassCard>
  );
}
