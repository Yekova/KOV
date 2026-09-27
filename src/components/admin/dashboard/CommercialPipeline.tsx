import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import type { LeadStatusRow } from "@/lib/leads/statuses";

// Le pipeline commercial : les leads par étape, avec la valeur de chaque
// colonne.
//
// Le dashboard affichait jusqu'ici le pipeline PROJET (discovery →
// proposal → production → review → delivery), c'est-à-dire l'avancement de
// ce qui est déjà vendu. L'entonnoir commercial — ce qui n'est pas encore
// signé — n'apparaissait nulle part, alors que c'est le haut du tunnel et
// la première chose qu'on veut voir le matin.
//
// Les colonnes viennent de lead_statuses, donc de la table que l'admin
// configure lui-même dans les réglages. Elles ne sont pas codées en dur :
// renommer une étape ou en ajouter une se voit ici sans toucher au code.
//
// Volontairement en lecture seule. Le glisser-déposer existe déjà sur
// /admin/leads?view=kanban, et en poser un second ici dupliquerait une
// logique optimiste-avec-retour-arrière pour la même action.

export interface PipelineLead {
  id: string;
  name: string;
  company: string | null;
  projectType: string | null;
  budgetCents: number | null;
  status: string;
}

function formatEuros(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
}

export function CommercialPipeline({ leads, statuses }: { leads: PipelineLead[]; statuses: LeadStatusRow[] }) {
  // Les étapes closes ne sont pas des colonnes d'entonnoir : « gagné » et
  // « perdu » sont des sorties, pas des files d'attente. Les afficher
  // écraserait visuellement les étapes actives, qui sont celles sur
  // lesquelles on peut encore agir.
  const columns = statuses.filter((status) => !status.isLost);

  const byStatus = new Map<string, PipelineLead[]>();
  for (const lead of leads) {
    byStatus.set(lead.status, [...(byStatus.get(lead.status) ?? []), lead]);
  }

  const openValueCents = leads
    .filter((lead) => columns.some((column) => column.key === lead.status && !column.isWon))
    .reduce((sum, lead) => sum + (lead.budgetCents ?? 0), 0);

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-baseline gap-3">
          <p className="text-xs uppercase tracking-widest text-kov-steel">Pipeline commercial</p>
          {openValueCents > 0 && (
            <span className="text-kov-bone text-sm tabular-nums">{formatEuros(openValueCents)} en jeu</span>
          )}
        </div>
        <Link href="/admin/leads?view=kanban" className="text-kov-red text-xs hover:underline">
          Ouvrir le tableau
        </Link>
      </div>

      {leads.length === 0 ? (
        <p className="text-kov-steel text-sm">
          Aucun lead pour l&apos;instant. Le formulaire de contact du site alimente cette colonne
          automatiquement.
        </p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((column) => {
            const items = byStatus.get(column.key) ?? [];
            const columnCents = items.reduce((sum, lead) => sum + (lead.budgetCents ?? 0), 0);

            return (
              <div key={column.key} className="min-w-0">
                <div
                  className="flex items-center justify-between gap-2 px-3 py-2 border-b-2"
                  style={{ borderColor: column.color ?? "var(--kov-border)" }}
                >
                  <span className="text-kov-bone text-[11px] uppercase tracking-widest truncate">{column.label}</span>
                  <span className="text-kov-steel text-xs tabular-nums shrink-0">{items.length}</span>
                </div>

                {/* La valeur de la colonne, seulement si elle en a une : un
                    « 0 € » sous chaque étape vide n'apprend rien. */}
                <p className="text-kov-steel text-[11px] px-3 pt-1.5 pb-2 tabular-nums h-6">
                  {columnCents > 0 ? formatEuros(columnCents) : ""}
                </p>

                <ul className="space-y-2">
                  {items.slice(0, 4).map((lead) => (
                    <li key={lead.id}>
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="block border px-3 py-2.5 transition-colors hover:border-kov-red"
                        style={{
                          borderColor: "var(--kov-border)",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--kov-carbon)",
                        }}
                      >
                        <p className="text-kov-bone text-xs truncate">{lead.company || lead.name}</p>
                        {lead.projectType && (
                          <p className="text-kov-steel text-[11px] truncate mt-0.5">{lead.projectType}</p>
                        )}
                        {lead.budgetCents !== null && lead.budgetCents > 0 && (
                          <p className="text-kov-concrete text-[11px] mt-1 tabular-nums">
                            {formatEuros(lead.budgetCents)}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}

                  {items.length > 4 && (
                    <li className="text-kov-steel text-[11px] px-3">+ {items.length - 4} autre{items.length - 4 > 1 ? "s" : ""}</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
