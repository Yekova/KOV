"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { X, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getComposerData, sendEmailToLead, saveEmailDraft, type ComposerData, type ComposerTemplate } from "@/app/admin/emails/actions";
import { resolveVariables } from "@/lib/email/variables";
import { EmailTemplatePicker } from "./EmailTemplatePicker";
import { EmailBodyEditor } from "./EmailBodyEditor";
import { EmailSignaturePicker } from "./EmailSignaturePicker";
import { EmailPreview } from "./EmailPreview";

const DRAFT_SAVE_DELAY_MS = 3000;

export function EmailComposer({
  leadId,
  onClose,
  initialCategory,
}: {
  leadId: string;
  onClose: () => void;
  initialCategory?: string;
}) {
  const [data, setData] = useState<ComposerData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [signatureId, setSignatureId] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [showConfirm, setShowConfirm] = useState(false);

  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftSavedLabel, setDraftSavedLabel] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasEditedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getComposerData(leadId).then((result) => {
      if (cancelled) return;
      setData(result);
      if (!result.lead) {
        setLoadError("Lead introuvable.");
        return;
      }
      const defaultSignature = result.signatures.find((s) => s.isDefault) ?? result.signatures[0] ?? null;
      setSignatureId(defaultSignature?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  // Escape closes, Cmd/Ctrl+Enter sends, Cmd/Ctrl+S saves a draft — spec
  // section 41, shown discreetly in the footer rather than as a tooltip
  // wall.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showConfirm) setShowConfirm(false);
        else onClose();
      } else if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (!showConfirm) setShowConfirm(true);
      } else if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        handleSaveDraft();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConfirm, subject, bodyHtml, selectedTemplateId]);

  function selectTemplate(template: ComposerTemplate | null) {
    setSelectedTemplateId(template?.id ?? null);
    setSubject(template?.subject ?? "");
    setBodyHtml(template?.bodyHtml ?? "");
    hasEditedRef.current = true;
    scheduleDraftSave();
  }

  function scheduleDraftSave() {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      handleSaveDraft(true);
    }, DRAFT_SAVE_DELAY_MS);
  }

  function handleSubjectChange(value: string) {
    setSubject(value);
    hasEditedRef.current = true;
    scheduleDraftSave();
  }

  function handleBodyChange(html: string) {
    setBodyHtml(html);
    hasEditedRef.current = true;
    scheduleDraftSave();
  }

  async function handleSaveDraft(silent = false) {
    if (!data?.lead || !hasEditedRef.current) return;
    if (!subject.trim() && (!bodyHtml.trim() || bodyHtml === "<p></p>")) return;

    setIsSavingDraft(true);
    const result = await saveEmailDraft({
      id: draftId ?? undefined,
      leadId,
      templateId: selectedTemplateId,
      subject,
      bodyHtml,
      bodyText: bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
    setIsSavingDraft(false);

    if (result.error) {
      if (!silent) toast.error(result.error);
      return;
    }
    if (result.id) setDraftId(result.id);
    setDraftSavedLabel("Brouillon enregistré à l'instant");
    if (!silent) toast.success("Brouillon enregistré");
  }

  async function handleSend() {
    if (!data?.lead) return;
    setIsSending(true);
    setError(null);

    const signature = data.signatures.find((s) => s.id === signatureId);
    const finalBodyHtml = signature ? `${bodyHtml}<hr />${signature.content}` : bodyHtml;

    const result = await sendEmailToLead({
      leadId,
      templateId: selectedTemplateId,
      subject,
      bodyHtml: finalBodyHtml,
      bodyText: finalBodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });

    setIsSending(false);

    if (result.error) {
      setError(result.error);
      setShowConfirm(false);
      return;
    }

    toast.success(`Email envoyé à ${data.lead.title ? `${data.lead.title} ` : ""}${data.lead.name}`);
    onClose();
  }

  const isEmpty = !subject.trim() && (!bodyHtml.trim() || bodyHtml === "<p></p>");
  const selectedTemplate = data?.templates.find((t) => t.id === selectedTemplateId) ?? null;
  const selectedSignature = data?.signatures.find((s) => s.id === signatureId) ?? null;

  return createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.6)" }} onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 h-screen w-full sm:w-[560px] overflow-y-auto border-l flex flex-col"
        style={{ zIndex: "var(--z-modal)", background: "var(--kov-black)", borderColor: "var(--glass-border)", boxShadow: "var(--glass-shadow-full)" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: "var(--kov-border)" }}>
          <p className="font-display text-kov-bone uppercase text-lg">Nouvel email</p>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-kov-steel hover:text-kov-red transition-colors">
            <X size={18} />
          </button>
        </div>

        {!data ? (
          <div className="p-6">
            <p className="text-kov-steel text-sm">{loadError ?? "Chargement…"}</p>
          </div>
        ) : !data.lead ? (
          <div className="p-6">
            <p className="text-kov-red text-sm">Lead introuvable.</p>
          </div>
        ) : showConfirm ? (
          <div className="p-6 space-y-6 flex-1">
            <p className="text-kov-bone text-base">Envoyer cet email ?</p>

            <div className="space-y-3 p-4" style={{ background: "var(--kov-carbon)", border: "1px solid var(--kov-border)", borderRadius: "var(--radius-md)" }}>
              <div>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">À</p>
                <p className="text-kov-bone text-sm">
                  {data.lead.title ? `${data.lead.title} ` : ""}
                  {data.lead.name} <span className="text-kov-steel">&lt;{data.lead.email}&gt;</span>
                </p>
              </div>
              <div>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">Objet</p>
                <p className="text-kov-bone text-sm">{resolveVariables(subject, data.variableValues) || "(sans objet)"}</p>
              </div>
              <div>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">Modèle</p>
                <p className="text-kov-bone text-sm">{selectedTemplate?.name ?? "Personnalisé"}</p>
              </div>
            </div>

            {error && <p className="text-kov-red text-sm">{error}</p>}

            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" disabled={isSending} onClick={() => setShowConfirm(false)}>
                Annuler
              </Button>
              <Button type="button" variant="primary" disabled={isSending} onClick={handleSend}>
                {isSending ? "Envoi…" : "Envoyer →"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <p className="text-kov-steel text-xs uppercase tracking-widest mb-1.5">À</p>
                <p className="text-kov-bone text-sm">
                  {data.lead.title ? `${data.lead.title} ` : ""}
                  {data.lead.name}
                </p>
                <p className="text-kov-steel text-xs">{data.lead.email}</p>
              </div>

              <div>
                <p className="text-kov-steel text-xs uppercase tracking-widest mb-1.5">Modèle</p>
                <EmailTemplatePicker
                  templates={data.templates}
                  recentTemplateIds={data.recentTemplateIds}
                  suggestedCategory={initialCategory}
                  selectedId={selectedTemplateId}
                  onSelect={selectTemplate}
                />
              </div>

              <div>
                <p className="text-kov-steel text-xs uppercase tracking-widest mb-1.5">Objet</p>
                <input
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  placeholder="Objet de l'email…"
                  className="w-full bg-transparent border px-3 py-2.5 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
                  style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                />
                {subject.includes("{{") && (
                  <p className="text-kov-steel text-xs mt-1">→ {resolveVariables(subject, data.variableValues) || "…"}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-kov-steel text-xs uppercase tracking-widest">Message</p>
                <div className="flex items-center gap-1 border p-0.5" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className="px-2.5 py-1 text-[10px] uppercase tracking-widest inline-flex items-center gap-1 transition-colors"
                    style={{ color: mode === "edit" ? "var(--kov-white)" : "var(--kov-steel)", background: mode === "edit" ? "var(--kov-red)" : "transparent", borderRadius: "var(--radius-sm)" }}
                  >
                    <Pencil size={11} /> Éditeur
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("preview")}
                    className="px-2.5 py-1 text-[10px] uppercase tracking-widest inline-flex items-center gap-1 transition-colors"
                    style={{ color: mode === "preview" ? "var(--kov-white)" : "var(--kov-steel)", background: mode === "preview" ? "var(--kov-red)" : "transparent", borderRadius: "var(--radius-sm)" }}
                  >
                    <Eye size={11} /> Aperçu
                  </button>
                </div>
              </div>

              {mode === "edit" ? (
                <div style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  <EmailBodyEditor value={bodyHtml} onChange={handleBodyChange} />
                </div>
              ) : (
                <EmailPreview
                  toName={`${data.lead.title ? `${data.lead.title} ` : ""}${data.lead.name}`}
                  toEmail={data.lead.email}
                  subject={subject}
                  bodyHtml={bodyHtml}
                  signatureHtml={selectedSignature?.content ?? ""}
                  variableValues={data.variableValues}
                />
              )}

              <div>
                <p className="text-kov-steel text-xs uppercase tracking-widest mb-1.5">Signature</p>
                <EmailSignaturePicker signatures={data.signatures} selectedId={signatureId} onChange={setSignatureId} />
              </div>
            </div>

            <div className="p-6 border-t shrink-0 space-y-3" style={{ borderColor: "var(--kov-border)" }}>
              {draftSavedLabel && !isSavingDraft && <p className="text-kov-steel text-xs">{draftSavedLabel}</p>}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button type="button" variant="secondary" disabled={isSavingDraft || isEmpty} onClick={() => handleSaveDraft(false)}>
                    Brouillon
                  </Button>
                  <Button type="button" variant="primary" disabled={isEmpty} onClick={() => setShowConfirm(true)}>
                    Envoyer →
                  </Button>
                </div>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest hidden sm:block">⌘⏎ Envoyer · ⌘S Brouillon · Esc Fermer</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>,
    document.body
  );
}
