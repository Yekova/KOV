"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Search, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getArticles, type PostRow } from "@/app/admin/content/actions";

interface ArticlePickerModalProps {
  onClose: () => void;
  onSelect: (article: PostRow) => void;
}

// Search modal for linking editor text to an internal article
// (/journal/[slug]). Fetches the full article list once on mount (this
// component is only ever mounted while the picker is open — RichEditor
// conditionally renders it) and filters client-side by title as the admin
// types, per spec.
export function ArticlePickerModal({ onClose, onSelect }: ArticlePickerModalProps) {
  const [articles, setArticles] = useState<PostRow[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    getArticles()
      .then((rows) => {
        if (!cancelled) setArticles(rows);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!articles) return [];
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((article) => article.title.toLowerCase().includes(q));
  }, [articles, query]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lier à un article interne"
      className="fixed inset-0 flex items-start justify-center px-4 py-10 overflow-y-auto"
      style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }}
      onClick={onClose}
    >
      <GlassCard variant="solid" className="w-full max-w-lg p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="font-display text-kov-bone text-lg uppercase">Lier à un article</p>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="text-kov-steel hover:text-kov-red transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative mb-4">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--kov-steel)" }}
          />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un article par titre…"
            className="w-full bg-transparent border py-2.5 pl-9 pr-3 text-kov-bone placeholder:text-kov-steel text-sm focus:outline-none focus:border-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </div>

        <div className="max-h-80 overflow-y-auto flex flex-col gap-1">
          {articles === null && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm" style={{ color: "var(--kov-steel)" }}>
              <Loader2 size={16} className="animate-spin" />
              Chargement…
            </div>
          )}
          {articles !== null && filtered.length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: "var(--kov-steel)" }}>
              Aucun article trouvé.
            </p>
          )}
          {filtered.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => onSelect(article)}
              className="flex items-center gap-3 px-3 py-2.5 text-left border border-transparent transition-colors hover:border-[var(--kov-border)]"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              {article.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.image}
                  alt=""
                  className="w-10 h-10 object-cover shrink-0"
                  style={{ borderRadius: "var(--radius-sm)" }}
                />
              ) : (
                <div className="w-10 h-10 shrink-0" style={{ background: "var(--kov-carbon)", borderRadius: "var(--radius-sm)" }} />
              )}
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-kov-bone truncate">{article.title}</span>
                <span className="block text-xs truncate" style={{ color: "var(--kov-steel)" }}>
                  /journal/{article.slug}
                </span>
              </span>
              <StatusBadge
                label={article.status === "published" ? "Publié" : "Brouillon"}
                tone={article.status === "published" ? "positive" : "neutral"}
              />
            </button>
          ))}
        </div>
      </GlassCard>
    </div>,
    document.body
  );
}
