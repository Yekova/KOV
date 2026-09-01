"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Star, ChevronDown, PenLine } from "lucide-react";
import { EMAIL_TEMPLATE_CATEGORY_LABELS, type EmailTemplateCategory } from "@/lib/admin/status";
import type { ComposerTemplate } from "@/app/admin/emails/actions";

export function EmailTemplatePicker({
  templates,
  recentTemplateIds,
  suggestedCategory,
  selectedId,
  onSelect,
}: {
  templates: ComposerTemplate[];
  recentTemplateIds: string[];
  suggestedCategory?: string | null;
  selectedId: string | null;
  onSelect: (template: ComposerTemplate | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleOpen() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX, width: rect.width });
    setOpen((v) => !v);
  }

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      templates.filter(
        (t) => !q || t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      ),
    [templates, q]
  );

  const recent = recentTemplateIds.map((id) => filtered.find((t) => t.id === id)).filter((t): t is ComposerTemplate => !!t);
  const favorites = filtered.filter((t) => t.isFavorite);
  const byCategory = new Map<string, ComposerTemplate[]>();
  for (const t of filtered) {
    if (!byCategory.has(t.category)) byCategory.set(t.category, []);
    byCategory.get(t.category)!.push(t);
  }

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  function pick(template: ComposerTemplate | null) {
    onSelect(template);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left transition-colors"
        style={{ background: "var(--kov-carbon)", border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      >
        <span className={selected ? "text-kov-bone" : "text-kov-steel"}>{selected ? selected.name : "Choisir un modèle…"}</span>
        <ChevronDown size={14} className="text-kov-steel shrink-0" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed max-h-[420px] overflow-y-auto"
            style={{
              top: position.top,
              left: position.left,
              width: Math.max(position.width, 320),
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-md)",
              backdropFilter: "var(--glass-blur)",
              boxShadow: "var(--glass-shadow-full)",
              zIndex: "var(--z-modal)" as unknown as number,
            }}
          >
            <div className="p-2 sticky top-0" style={{ background: "var(--kov-black)" }}>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-kov-steel" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un modèle…"
                  className="w-full bg-transparent border pl-8 pr-2 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
                  style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => pick(null)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-kov-bone hover:bg-white/5 transition-colors text-left"
            >
              <PenLine size={13} className="text-kov-red shrink-0" />
              Personnalisé — écrire librement
            </button>

            {recent.length > 0 && !q && (
              <div className="border-t py-1" style={{ borderColor: "var(--kov-border)" }}>
                <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-kov-steel">Récemment utilisés</p>
                {recent.map((t) => (
                  <TemplateOption key={t.id} template={t} onClick={() => pick(t)} />
                ))}
              </div>
            )}

            {favorites.length > 0 && !q && (
              <div className="border-t py-1" style={{ borderColor: "var(--kov-border)" }}>
                <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-kov-steel">Favoris</p>
                {favorites.map((t) => (
                  <TemplateOption key={t.id} template={t} onClick={() => pick(t)} />
                ))}
              </div>
            )}

            {Array.from(byCategory.entries()).map(([category, items]) => (
              <div key={category} className="border-t py-1" style={{ borderColor: "var(--kov-border)" }}>
                <p className="px-3 py-1 text-[10px] uppercase tracking-widest" style={{ color: category === suggestedCategory ? "var(--kov-red)" : "var(--kov-steel)" }}>
                  {EMAIL_TEMPLATE_CATEGORY_LABELS[category as EmailTemplateCategory] ?? category}
                </p>
                {items.map((t) => (
                  <TemplateOption key={t.id} template={t} onClick={() => pick(t)} />
                ))}
              </div>
            ))}

            {filtered.length === 0 && <p className="px-3 py-4 text-kov-steel text-sm text-center">Aucun modèle ne correspond.</p>}
          </div>,
          document.body
        )}
    </>
  );
}

function TemplateOption({ template, onClick }: { template: ComposerTemplate; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-kov-bone hover:bg-white/5 transition-colors text-left">
      <span className="truncate">{template.name}</span>
      {template.isFavorite && <Star size={12} className="text-kov-red shrink-0" fill="var(--kov-red)" />}
    </button>
  );
}
