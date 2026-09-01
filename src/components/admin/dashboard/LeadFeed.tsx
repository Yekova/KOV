import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { LEAD_STATUS_COLORS, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/admin/status";

export type LeadFeedItem = {
  id: string;
  name: string;
  company: string | null;
  project_type: string | null;
  status: string;
  created_at: string;
  budget_cents: number | null;
};

export function LeadFeed({ leads }: { leads: LeadFeedItem[] }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-kov-steel">Demandes / Leads récents</p>
        <Link href="/admin/leads" className="text-kov-red text-xs hover:underline">
          Voir tout
        </Link>
      </div>

      {leads.length === 0 ? (
        <EmptyState message="Aucun lead pour l'instant." />
      ) : (
        <ul className="space-y-4">
          {leads.map((lead) => {
            const color = LEAD_STATUS_COLORS[lead.status as LeadStatus] ?? "var(--kov-steel)";
            return (
              <li key={lead.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2 h-2 shrink-0" style={{ background: color, borderRadius: "var(--radius-pill)" }} />
                  <div className="min-w-0">
                    <p className="text-kov-bone text-sm truncate">{lead.name}</p>
                    <p className="text-kov-steel text-xs truncate">
                      {lead.company || lead.project_type || "—"}
                      {lead.budget_cents ? ` — ${(lead.budget_cents / 100).toLocaleString("fr-FR")} €` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs" style={{ color }}>
                    {LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}
                  </p>
                  <p className="text-kov-steel text-xs mt-0.5">{formatRelativeTime(lead.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
