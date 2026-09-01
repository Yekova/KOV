"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Star, Copy, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EMAIL_TEMPLATE_CATEGORY_LABELS, type EmailTemplateCategory } from "@/lib/admin/status";
import { setEmailTemplateActive, toggleEmailTemplateFavorite, duplicateEmailTemplate, type EmailTemplateRow } from "./actions";
import { EmailTemplateForm } from "./EmailTemplateForm";

export function EmailTemplatesManager({ templates }: { templates: EmailTemplateRow[] }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EmailTemplateRow | null | "new">(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    );
  }, [templates, query]);

  const byCategory = new Map<string, EmailTemplateRow[]>();
  for (const t of filtered) {
    if (!byCategory.has(t.category)) byCategory.set(t.category, []);
    byCategory.get(t.category)!.push(t);
  }

  async function handleToggleFavorite(t: EmailTemplateRow) {
    const result = await toggleEmailTemplateFavorite(t.id, !t.isFavorite);
    if (result.error) toast.error(result.error);
  }

  async function handleToggleActive(t: EmailTemplateRow) {
    const result = await setEmailTemplateActive(t.id, !t.isActive);
    if (result.error) toast.error(result.error);
    else toast.success(t.isActive ? "Modèle désactivé" : "Modèle réactivé");
  }

  async function handleDuplicate(t: EmailTemplateRow) {
    const result = await duplicateEmailTemplate(t.id);
    if (result.error) toast.error(result.error);
    else toast.success("Modèle dupliqué");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kov-steel" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="bg-transparent border pl-9 pr-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors w-64"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </div>
        <Button type="button" variant="primary" onClick={() => setEditing("new")}>
          + Nouveau modèle
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-kov-steel text-sm">Aucun modèle ne correspond.</p>
      ) : (
        Array.from(byCategory.entries()).map(([category, items]) => (
          <div key={category}>
            <p className="text-xs uppercase tracking-widest text-kov-steel mb-3">{EMAIL_TEMPLATE_CATEGORY_LABELS[category as EmailTemplateCategory] ?? category}</p>
            <div className="space-y-2">
              {items.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-4 p-4"
                  style={{ background: "var(--kov-carbon)", border: "1px solid var(--kov-border)", borderRadius: "var(--radius-md)", opacity: t.isActive ? 1 : 0.55 }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-kov-bone text-sm">{t.name}</p>
                      {!t.isActive && <span className="text-kov-steel text-[10px] uppercase tracking-widest">Inactif</span>}
                    </div>
                    {t.description && <p className="text-kov-steel text-xs mt-1">{t.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button type="button" onClick={() => handleToggleFavorite(t)} aria-label="Favori" className="text-kov-steel hover:text-kov-red transition-colors">
                      <Star size={15} fill={t.isFavorite ? "var(--kov-red)" : "none"} color={t.isFavorite ? "var(--kov-red)" : "currentColor"} />
                    </button>
                    <button type="button" onClick={() => handleDuplicate(t)} aria-label="Dupliquer" className="text-kov-steel hover:text-kov-bone transition-colors">
                      <Copy size={15} />
                    </button>
                    <button type="button" onClick={() => handleToggleActive(t)} className="text-xs uppercase tracking-widest text-kov-steel hover:text-kov-red transition-colors">
                      {t.isActive ? "Désactiver" : "Réactiver"}
                    </button>
                    <button type="button" onClick={() => setEditing(t)} className="text-kov-red text-xs uppercase tracking-widest hover:underline">
                      Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {editing && <EmailTemplateForm template={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
