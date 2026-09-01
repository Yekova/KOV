"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Select } from "@/components/ui/Select";
import { EmailBodyEditor } from "@/components/email/EmailBodyEditor";
import { EMAIL_TEMPLATE_CATEGORIES, EMAIL_TEMPLATE_CATEGORY_LABELS } from "@/lib/admin/status";
import { createEmailTemplate, updateEmailTemplate, type EmailTemplateRow } from "./actions";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export function EmailTemplateForm({ template, onClose }: { template: EmailTemplateRow | null; onClose: () => void }) {
  const [name, setName] = useState(template?.name ?? "");
  const [category, setCategory] = useState(template?.category ?? "contact");
  const [description, setDescription] = useState(template?.description ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [bodyHtml, setBodyHtml] = useState(template?.bodyHtml ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("category", category);
    formData.set("description", description);
    formData.set("subject", subject);
    formData.set("body_html", bodyHtml);

    startTransition(async () => {
      const result = template ? await updateEmailTemplate(template.id, formData) : await createEmailTemplate(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(template ? "Modèle mis à jour" : "Modèle créé");
      onClose();
    });
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 flex items-start justify-center px-4 py-10 overflow-y-auto"
      style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }}
      onClick={onClose}
    >
      <GlassCard variant="solid" className="w-full max-w-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-display text-kov-bone text-lg uppercase">{template ? "Modifier le modèle" : "Nouveau modèle"}</p>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-kov-steel hover:text-kov-red transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-xs text-kov-steel">
            Nom du modèle
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
          </label>
          <label className="text-xs text-kov-steel">
            Catégorie
            <Select
              value={category}
              onChange={setCategory}
              options={EMAIL_TEMPLATE_CATEGORIES.map((c) => ({ value: c, label: EMAIL_TEMPLATE_CATEGORY_LABELS[c] }))}
              className={`${FIELD_CLASS} mt-1`}
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            />
          </label>
        </div>

        <label className="block text-xs text-kov-steel">
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="À quoi sert ce modèle…"
            className={`${FIELD_CLASS} mt-1`}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </label>

        <label className="block text-xs text-kov-steel">
          Objet
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Votre projet avec KOV — {{project_name}}"
            className={`${FIELD_CLASS} mt-1`}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </label>

        <div>
          <p className="text-xs text-kov-steel mb-1">Corps du message</p>
          <div style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
            <EmailBodyEditor value={bodyHtml} onChange={setBodyHtml} />
          </div>
        </div>

        {error && <p className="text-kov-red text-sm">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <Button type="button" variant="secondary" disabled={isPending} onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" variant="primary" disabled={isPending} onClick={handleSave}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </GlassCard>
    </div>,
    document.body
  );
}
