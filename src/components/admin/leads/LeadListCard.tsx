"use client";

import Link from "next/link";
import { CalendarDays, Clock, Mail, Phone } from "lucide-react";
import { ClientAvatar } from "@/components/admin/clients/ClientAvatar";
import { LeadStatusSelect } from "@/app/admin/leads/LeadStatusSelect";
import { AssignLeadSelect } from "@/app/admin/leads/AssignLeadSelect";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { leadScoreTier, LEAD_SCORE_TIER_COLORS } from "@/lib/leads/scoring";
import { LEAD_SOURCE_LABELS, normalizeLeadSource } from "@/lib/admin/status";
import type { LeadRow, PickerOption } from "@/components/admin/leads/types";
import type { LeadStatusRow } from "@/lib/leads/statuses";

// La carte d'un lead.
//
// Elle remplace une table de douze colonnes. Douze colonnes obligeaient à
// défiler horizontalement pour lire un lead entier, et la moitié affichait
// « — » sur la plupart des lignes.
//
// ── DEUX SÉLECTEURS, PAS TROIS ───────────────────────────────────────────
//
// Le statut et le responsable restent modifiables sur la carte : ce sont les
// deux champs qu'on change en triant sa liste. La source descend sur la
// fiche — elle se renseigne une fois à la création et ne bouge plus, donc
// lui donner un contrôle permanent sur chaque carte coûtait plus qu'il ne
// rapportait.
//
// ── CE QUI EST ABSENT EST DIT ────────────────────────────────────────────
//
// Un champ vide écrit ce qui manque plutôt que d'afficher un tiret. « Aucune
// prochaine action » est une information : c'est un lead dont personne ne
// s'occupe.

function formatBudget(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export function LeadListCard({
  lead,
  statuses,
  admins,
  selected,
  onToggleSelect,
  todayIso,
}: {
  lead: LeadRow;
  statuses: LeadStatusRow[];
  admins: PickerOption[];
  selected: boolean;
  onToggleSelect: () => void;
  todayIso: string;
}) {
  const tier = leadScoreTier(lead.score);
  const statusColor = statuses.find((entry) => entry.key === lead.status)?.color ?? "var(--kov-steel)";
  const title = lead.company?.trim() || lead.name;
  const subtitle = lead.company?.trim() ? lead.name : null;
  const overdueAction = Boolean(lead.nextActionDate && lead.nextActionDate < todayIso);

  return (
    <article
      className="flex flex-col border transition-colors hover:border-kov-red"
      style={{
        borderColor: selected ? "var(--kov-red)" : "var(--kov-border)",
        borderRadius: "var(--radius-md, 10px)",
        background: "var(--kov-carbon)",
      }}
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="mt-1 accent-kov-red shrink-0"
          aria-label={`Sélectionner ${title}`}
        />

        <ClientAvatar name={title} avatarUrl={null} size={36} />

        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/leads/${lead.id}`}
            className="block text-kov-bone text-sm truncate hover:text-kov-red transition-colors"
          >
            {title}
          </Link>
          <p className="text-kov-steel text-[11px] truncate mt-0.5">
            {subtitle ? subtitle : "Société non renseignée"}
          </p>
        </div>

        {tier && (
          <span
            className="px-2 py-0.5 text-[10px] uppercase tracking-widest border shrink-0 tabular-nums"
            style={{
              color: LEAD_SCORE_TIER_COLORS[tier],
              borderColor: LEAD_SCORE_TIER_COLORS[tier],
              borderRadius: "var(--radius-pill)",
            }}
            title="Score calculé, non saisi"
          >
            {lead.score}
          </span>
        )}
      </div>

      {/* ── Qualification ─────────────────────────────────────────────── */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
        <span className="text-kov-steel">{LEAD_SOURCE_LABELS[normalizeLeadSource(lead.source)]}</span>
        {lead.budgetCents !== null && lead.budgetCents > 0 && (
          <span className="text-kov-bone tabular-nums">{formatBudget(lead.budgetCents)}</span>
        )}
        <span className="flex items-center gap-3 ml-auto">
          <a href={`mailto:${lead.email}`} className="text-kov-steel hover:text-kov-red transition-colors" title={lead.email}>
            <Mail size={13} aria-hidden="true" />
            <span className="sr-only">Écrire à {title}</span>
          </a>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="text-kov-steel hover:text-kov-red transition-colors" title={lead.phone}>
              <Phone size={13} aria-hidden="true" />
              <span className="sr-only">Appeler {title}</span>
            </a>
          )}
        </span>
      </div>

      {/* ── Suivi ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t space-y-2 mt-auto" style={{ borderColor: "var(--kov-border)" }}>
        <div className="flex items-start gap-2.5">
          <CalendarDays size={13} className="text-kov-steel shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0 text-[11px] leading-snug">
            {lead.nextActionDate || lead.nextActionNote ? (
              <>
                <p className="text-kov-concrete truncate">{lead.nextActionNote?.trim() || "Prochaine action"}</p>
                {lead.nextActionDate && (
                  <p style={{ color: overdueAction ? "var(--kov-red)" : "var(--kov-steel)" }}>
                    {formatDate(lead.nextActionDate)}
                    {/* Le retard est écrit, pas seulement teinté. */}
                    {overdueAction && " · dépassée"}
                  </p>
                )}
              </>
            ) : (
              <p className="text-kov-steel">Aucune prochaine action</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Clock size={13} className="text-kov-steel shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-kov-steel text-[11px] leading-snug">
            {lead.lastContactedAt
              ? `Contacté ${formatRelativeTime(lead.lastContactedAt)}`
              : `Jamais contacté · reçu ${formatRelativeTime(lead.createdAt)}`}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 min-w-0" style={{ borderLeft: `2px solid ${statusColor}`, paddingLeft: 6 }}>
            <LeadStatusSelect leadId={lead.id} status={lead.status} statuses={statuses} />
          </div>
          <div className="flex-1 min-w-0">
            <AssignLeadSelect leadId={lead.id} assignedTo={lead.assignedTo} admins={admins} />
          </div>
        </div>
      </div>
    </article>
  );
}
