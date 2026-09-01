"use client";

import { useEffect, useState } from "react";
import { Mail, Check, CheckCheck, Eye as EyeIcon, MousePointerClick, X as XIcon } from "lucide-react";
import { getLeadEmailHistory, getEmailLogDetail, type LeadEmailHistoryItem, type EmailLogDetail } from "@/app/admin/emails/actions";
import { EMAIL_STATUS_LABELS, isEmailStatus } from "@/lib/admin/status";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function EmailStatusLine({ item }: { item: LeadEmailHistoryItem }) {
  if (item.status === "draft") return <span className="text-kov-steel text-xs">Brouillon</span>;
  if (item.status === "failed") return <span className="text-kov-red text-xs inline-flex items-center gap-1"><XIcon size={12} /> Échec</span>;
  if (item.status === "bounced") return <span className="text-kov-red text-xs inline-flex items-center gap-1"><XIcon size={12} /> Rejeté</span>;

  return (
    <span className="flex items-center gap-2 flex-wrap">
      {item.sentAt && <span className="text-kov-steel text-xs inline-flex items-center gap-1"><Check size={12} /> Envoyé</span>}
      {item.deliveredAt && <span className="text-kov-steel text-xs inline-flex items-center gap-1"><CheckCheck size={12} /> Délivré</span>}
      {item.openedAt && <span className="text-kov-steel text-xs inline-flex items-center gap-1"><EyeIcon size={12} /> Ouvert</span>}
      {item.clickedAt && <span className="text-kov-steel text-xs inline-flex items-center gap-1"><MousePointerClick size={12} /> Cliqué</span>}
    </span>
  );
}

export function EmailDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [detail, setDetail] = useState<EmailLogDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEmailLogDetail(id).then((result) => {
      if (!cancelled) setDetail(result);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="fixed inset-0 flex items-start justify-center px-4 py-10 overflow-y-auto" style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }} onClick={onClose}>
      <div
        className="w-full max-w-xl p-6 space-y-5"
        style={{ background: "var(--kov-black)", border: "1px solid var(--kov-border)", borderRadius: "var(--radius-md)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {!detail ? (
          <p className="text-kov-steel text-sm">Chargement…</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <p className="font-display text-kov-bone uppercase text-lg">{detail.subject}</p>
              <button type="button" onClick={onClose} aria-label="Fermer" className="text-kov-steel hover:text-kov-red transition-colors shrink-0">
                <XIcon size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">Destinataire</p>
                <p className="text-kov-bone">{detail.recipient}</p>
              </div>
              <div>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">Expéditeur</p>
                <p className="text-kov-bone">{detail.senderName ?? "—"}</p>
              </div>
              <div>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">Date</p>
                <p className="text-kov-bone">{formatDateTime(detail.createdAt)}</p>
              </div>
              <div>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">Modèle</p>
                <p className="text-kov-bone">{detail.templateName ?? "Personnalisé"}</p>
              </div>
              <div>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">Statut</p>
                <p className="text-kov-bone">{detail.statusLabel}</p>
              </div>
            </div>

            <div>
              <p className="text-kov-steel text-xs uppercase tracking-widest mb-2">Contenu</p>
              <div
                className="p-4 kov-email-preview-body"
                style={{ background: "var(--kov-carbon)", border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                dangerouslySetInnerHTML={{ __html: detail.bodyHtml }}
              />
            </div>

            <div>
              <p className="text-kov-steel text-xs uppercase tracking-widest mb-2">Activité</p>
              <EmailStatusLine
                item={{
                  id: detail.id,
                  subject: detail.subject,
                  status: detail.status,
                  templateName: detail.templateName,
                  sentAt: detail.sentAt,
                  deliveredAt: detail.deliveredAt,
                  openedAt: detail.openedAt,
                  clickedAt: detail.clickedAt,
                  failedAt: detail.failedAt,
                  createdAt: detail.createdAt,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function EmailHistory({ leadId, refreshKey }: { leadId: string; refreshKey: number }) {
  const [items, setItems] = useState<LeadEmailHistoryItem[] | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLeadEmailHistory(leadId).then((result) => {
      if (!cancelled) setItems(result);
    });
    return () => {
      cancelled = true;
    };
  }, [leadId, refreshKey]);

  if (!items) return <p className="text-kov-steel text-sm">Chargement…</p>;
  if (items.length === 0) return <p className="text-kov-steel text-sm">Aucun email envoyé pour l&apos;instant.</p>;

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div key={item.id} className={`py-4 flex items-start justify-between gap-4 ${index > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--kov-border)" }}>
          <div className="flex items-start gap-3 min-w-0">
            <Mail size={15} className="text-kov-steel mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-kov-steel text-[10px] uppercase tracking-widest">{formatDateTime(item.createdAt)}</p>
              <p className="text-kov-bone text-sm mt-0.5 truncate">{item.subject}</p>
              {item.templateName && <p className="text-kov-steel text-xs mt-0.5">{item.templateName}</p>}
              <div className="mt-1.5">
                <EmailStatusLine item={item} />
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setDetailId(item.id)} className="text-kov-red text-xs uppercase tracking-widest hover:underline shrink-0">
            Voir
          </button>
        </div>
      ))}

      {detailId && <EmailDetailModal id={detailId} onClose={() => setDetailId(null)} />}

      <style jsx global>{`
        .kov-email-preview-body {
          color: var(--kov-bone);
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .kov-email-preview-body > * + * {
          margin-top: 0.75em;
        }
      `}</style>
    </div>
  );
}

export function emailStatusLabel(status: string): string {
  return isEmailStatus(status) ? EMAIL_STATUS_LABELS[status] : status;
}
