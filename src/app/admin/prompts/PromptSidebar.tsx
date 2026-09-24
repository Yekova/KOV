"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { PromptFilters } from "./actions";
import type { PromptCategoryRow, PromptCollectionRow, PromptTagRow } from "./library-actions";

// Le rail de gauche répond à « de quoi ça parle » : catégorie, collection,
// tag, favoris. La barre du haut répond à « quel genre, dans quel état » :
// type, outil, statut, tri. Deux questions, deux endroits — un même filtre
// offert aux deux endroits devient vite deux filtres qui se contredisent.

function Row({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors"
      style={{
        color: active ? "var(--kov-bone)" : "var(--kov-steel)",
        background: active ? "rgba(227,30,36,0.10)" : "transparent",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className="tabular-nums opacity-70">{count}</span>}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-2.5 text-[10px] uppercase tracking-widest text-kov-steel mb-1.5">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function PromptSidebar({
  categories,
  collections,
  tags,
  filters,
  onChange,
  total,
}: {
  categories: PromptCategoryRow[];
  collections: PromptCollectionRow[];
  tags: PromptTagRow[];
  filters: PromptFilters;
  onChange: (patch: Partial<PromptFilters>) => void;
  total: number;
}) {
  const noScope = !filters.categoryId && !filters.collectionId && !filters.tagSlug && !filters.favoritesOnly;

  /** Choisir une catégorie efface la collection et le tag, et inversement.
   *  Les empiler donne surtout des listes vides que personne ne sait
   *  expliquer. */
  const scope = (patch: Partial<PromptFilters>) =>
    onChange({ categoryId: "", collectionId: "", tagSlug: "", favoritesOnly: false, ...patch });

  return (
    <aside className="space-y-5">
      <div className="space-y-0.5">
        <Row label="Tous les prompts" count={total} active={noScope} onClick={() => scope({})} />
        <Row
          label="Favoris"
          active={Boolean(filters.favoritesOnly)}
          onClick={() => scope({ favoritesOnly: true })}
          icon={<Star size={12} />}
        />
      </div>

      {categories.length > 0 && (
        <Group title="Catégories">
          {categories.map((category) => (
            <Row
              key={category.id}
              label={category.name}
              count={category.count}
              active={filters.categoryId === category.id}
              onClick={() => scope({ categoryId: category.id })}
            />
          ))}
        </Group>
      )}

      {collections.length > 0 && (
        <Group title="Collections">
          {collections.map((collection) => (
            <Row
              key={collection.id}
              label={collection.name}
              count={collection.count}
              active={filters.collectionId === collection.id}
              onClick={() => scope({ collectionId: collection.id })}
            />
          ))}
        </Group>
      )}

      {tags.length > 0 && (
        <Group title="Tags">
          <div className="flex flex-wrap gap-1.5 px-2.5">
            {tags.slice(0, 18).map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => scope({ tagSlug: filters.tagSlug === tag.slug ? "" : tag.slug })}
                className="px-2 py-0.5 text-[10px] uppercase tracking-widest border transition-colors"
                style={{
                  borderColor: filters.tagSlug === tag.slug ? "var(--kov-red)" : "var(--kov-border)",
                  color: filters.tagSlug === tag.slug ? "var(--kov-red)" : "var(--kov-steel)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </Group>
      )}

      <div className="pt-2 border-t space-y-0.5" style={{ borderColor: "var(--kov-border)" }}>
        <Link
          href="/admin/prompts/collections"
          className="block px-2.5 py-1.5 text-xs text-kov-steel hover:text-kov-bone transition-colors"
        >
          Gérer catégories et collections
        </Link>
        <Link
          href="/admin/prompts/builder"
          className="block px-2.5 py-1.5 text-xs text-kov-steel hover:text-kov-bone transition-colors"
        >
          Prompt Builder
        </Link>
        <Link
          href="/admin/prompts/history"
          className="block px-2.5 py-1.5 text-xs text-kov-steel hover:text-kov-bone transition-colors"
        >
          Historique d&apos;usage
        </Link>
      </div>
    </aside>
  );
}
