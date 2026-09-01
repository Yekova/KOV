"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { discardEmailDraft } from "@/app/admin/emails/actions";
import { EmailDetailModal, EmailStatusLine } from "./EmailHistory";
import { EmptyState } from "@/components/admin/EmptyState";

export interface EmailListItem {
  id: string;
  leadId: string | null;
  leadName: string;
  templateName: string | null;
  subject: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  failedAt: string | null;
  createdAt: string;
}

type Tab = "drafts" | "sent" | "failed";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function EmailListView({ items: initialItems }: { items: EmailListItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [tab, setTab] = useState<Tab>("sent");
  const [detailId, setDetailId] = useState<string | null>(null);

  const tabbed = useMemo(() => {
    if (tab === "drafts") return items.filter((i) => i.status === "draft");
    if (tab === "failed") return items.filter((i) => i.status === "failed" || i.status === "bounced");
    return items.filter((i) => i.status !== "draft" && i.status !== "failed" && i.status !== "bounced");
  }, [items, tab]);

  const counts = {
    drafts: items.filter((i) => i.status === "draft").length,
    sent: items.filter((i) => i.status !== "draft" && i.status !== "failed" && i.status !== "bounced").length,
    failed: items.filter((i) => i.status === "failed" || i.status === "bounced").length,
  };

  async function handleDiscard(id: string) {
    if (!window.confirm("Supprimer ce brouillon ?")) return;
    const result = await discardEmailDraft(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Brouillon supprimé");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b" style={{ borderColor: "var(--kov-border)" }}>
        {([
          ["sent", "Envoyés", counts.sent],
          ["drafts", "Brouillons", counts.drafts],
          ["failed", "Échecs", counts.failed],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-3 pb-3 text-xs uppercase tracking-widest whitespace-nowrap transition-colors"
            style={{
              color: tab === key ? "var(--kov-red)" : "var(--kov-steel)",
              borderBottom: tab === key ? "2px solid var(--kov-red)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {label}
            <span className="px-1.5 py-0.5 text-[10px]" style={{ background: tab === key ? "var(--kov-red)" : "var(--kov-graphite)", color: tab === key ? "var(--kov-white)" : "var(--kov-steel)", borderRadius: "var(--radius-pill)" }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {tabbed.length === 0 ? (
        <EmptyState message="Rien ici pour l'instant." />
      ) : (
        <div className="space-y-1">
          {tabbed.map((item, index) => (
            <div key={item.id} className={`py-4 flex items-start justify-between gap-4 ${index > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--kov-border)" }}>
              <div className="min-w-0">
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">{formatDateTime(item.createdAt)}</p>
                <p className="text-kov-bone text-sm mt-0.5 truncate">{item.subject || "(sans objet)"}</p>
                <p className="text-kov-steel text-xs mt-0.5">
                  {item.leadId ? (
                    <Link href={`/admin/leads/${item.leadId}`} className="hover:text-kov-red transition-colors">
                      {item.leadName}
                    </Link>
                  ) : (
                    item.leadName
                  )}
                  {item.templateName && ` — ${item.templateName}`}
                </p>
                {tab === "sent" && (
                  <div className="mt-1.5">
                    <EmailStatusLine item={item} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {tab === "drafts" && (
                  <button type="button" onClick={() => handleDiscard(item.id)} className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors">
                    Supprimer
                  </button>
                )}
                <button type="button" onClick={() => setDetailId(item.id)} className="text-kov-red text-xs uppercase tracking-widest hover:underline">
                  Voir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailId && <EmailDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
