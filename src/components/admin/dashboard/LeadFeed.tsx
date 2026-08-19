import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

export type LeadFeedItem = {
  id: string;
  name: string;
  company: string | null;
  project_type: string | null;
  status: string;
  created_at: string;
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
          {leads.map((lead) => (
            <li key={lead.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-2 h-2 shrink-0"
                  style={{
                    background: lead.status === "new" ? "var(--kov-red)" : "var(--kov-steel)",
                    borderRadius: "var(--radius-pill)",
                  }}
                />
                <div className="min-w-0">
                  <p className="text-kov-bone text-sm truncate">{lead.name}</p>
                  <p className="text-kov-steel text-xs truncate">{lead.company || lead.project_type || "—"}</p>
                </div>
              </div>
              <span className="text-kov-steel text-xs shrink-0">{formatRelativeTime(lead.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
