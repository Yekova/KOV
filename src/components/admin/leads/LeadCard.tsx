"use client";

import Link from "next/link";
import { Avatar } from "@/components/admin/Avatar";
import { DateBadge } from "@/components/admin/DateBadge";
import { leadScoreTier, LEAD_SCORE_TIER_LABELS, LEAD_SCORE_TIER_COLORS } from "@/lib/leads/scoring";
import type { LeadRow } from "./types";

export function LeadCard({ lead, dragging }: { lead: LeadRow; dragging: boolean }) {
  const tier = leadScoreTier(lead.score);
  const isOverdue = !!lead.nextActionDate && new Date(lead.nextActionDate) < new Date();

  return (
    <Link
      href={`/admin/leads/${lead.id}`}
      className="block p-3 border cursor-grab active:cursor-grabbing transition-opacity"
      style={{
        borderColor: "var(--kov-border)",
        borderRadius: "var(--radius-sm)",
        background: "var(--kov-graphite)",
        opacity: dragging ? 0.4 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-kov-bone text-sm">{lead.name}</p>
        {tier && (
          <span
            className="shrink-0 px-1.5 py-0.5 text-[9px] uppercase tracking-widest border"
            style={{ color: LEAD_SCORE_TIER_COLORS[tier], borderColor: LEAD_SCORE_TIER_COLORS[tier], borderRadius: "var(--radius-sm)" }}
          >
            {LEAD_SCORE_TIER_LABELS[tier]}
          </span>
        )}
      </div>
      {lead.company && <p className="text-kov-steel text-xs mt-1 truncate">{lead.company}</p>}

      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
        <span className="text-kov-bone text-xs whitespace-nowrap">
          {lead.budgetCents ? `${(lead.budgetCents / 100).toLocaleString("fr-FR")} €` : "—"}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {lead.assigneeName && <Avatar name={lead.assigneeName} />}
          {lead.nextActionDate && <DateBadge date={lead.nextActionDate} isOverdue={isOverdue} />}
        </div>
      </div>
    </Link>
  );
}
