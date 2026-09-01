"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Pencil, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/admin/EmptyState";
import { getArticles, deletePost, reorderPosts, type PostRow } from "./actions";

function Skeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse" style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }} />
      ))}
    </div>
  );
}

function DeleteButton({ article }: { article: PostRow }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deletePost(article.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Article supprimé");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "La suppression a échoué."),
  });

  return (
    <button
      type="button"
      disabled={mutation.isPending}
      onClick={() => {
        if (window.confirm("Supprimer cet article ? Cette action est irréversible.")) mutation.mutate();
      }}
      className="text-kov-steel hover:text-kov-red transition-colors disabled:opacity-50"
      aria-label="Supprimer"
    >
      {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  );
}

export function ArticlesList() {
  const queryClient = useQueryClient();
  const { data: articles, isLoading } = useQuery({ queryKey: ["articles"], queryFn: getArticles });

  const reorderMutation = useMutation({
    mutationFn: (updates: { id: string; sortOrder: number }[]) => reorderPosts(updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }),
    onError: () => toast.error("Le réordonnancement a échoué."),
  });

  function handleReorder(index: number, direction: -1 | 1) {
    if (!articles) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= articles.length) return;

    // If sort_order was never initialized, assign index-based values to
    // every row first so the swap below has real numbers to work with.
    const needsInit = articles.every((a) => a.sortOrder === null);
    const withOrder = needsInit ? articles.map((a, i) => ({ ...a, sortOrder: i })) : articles;

    const a = withOrder[index];
    const b = withOrder[targetIndex];
    reorderMutation.mutate([
      { id: a.id, sortOrder: b.sortOrder ?? targetIndex },
      { id: b.id, sortOrder: a.sortOrder ?? index },
    ]);
  }

  if (isLoading) return <Skeleton />;

  const rows = articles ?? [];

  if (rows.length === 0) return <EmptyState message="Aucun article pour l'instant." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-xs uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
            <th className="py-3 pr-4"></th>
            <th className="py-3 pr-4">Article</th>
            <th className="py-3 pr-4">Catégorie</th>
            <th className="py-3 pr-4">Date</th>
            <th className="py-3 pr-4">Statut</th>
            <th className="py-3 pr-4 text-center">À la une</th>
            <th className="py-3 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((article, index) => (
            <tr key={article.id} className="border-b group hover:bg-white/[0.02] transition-colors" style={{ borderColor: "var(--kov-border)" }}>
              <td className="py-3 pr-4">
                {article.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={article.image} alt="" className="w-12 h-12 object-cover" style={{ borderRadius: "var(--radius-sm)" }} />
                ) : (
                  <div className="w-12 h-12" style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }} />
                )}
              </td>
              <td className="py-3 pr-4">
                <Link href={`/admin/content/${article.id}`} className="text-kov-bone hover:text-kov-red transition-colors">
                  {article.title}
                </Link>
                <p className="text-kov-steel text-xs mt-0.5">/journal/{article.slug}</p>
              </td>
              <td className="py-3 pr-4 text-kov-steel">{article.tag || "—"}</td>
              <td className="py-3 pr-4 text-kov-steel whitespace-nowrap">{article.dateLabel || "—"}</td>
              <td className="py-3 pr-4">
                <span
                  className="text-[10px] uppercase tracking-widest px-2 py-0.5"
                  style={{
                    color: article.status === "published" ? "var(--kov-red)" : "var(--kov-steel)",
                    background: article.status === "published" ? "rgba(220,38,38,0.1)" : "var(--kov-graphite)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {article.status === "published" ? "Publié" : "Brouillon"}
                </span>
              </td>
              <td className="py-3 pr-4 text-center">
                <Star size={16} className="inline" fill={article.featured ? "var(--kov-red)" : "none"} color={article.featured ? "var(--kov-red)" : "var(--kov-steel)"} />
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" disabled={index === 0} onClick={() => handleReorder(index, -1)} className="text-kov-steel hover:text-kov-red disabled:opacity-30 transition-colors" aria-label="Monter">
                      <ArrowUp size={13} />
                    </button>
                    <button type="button" disabled={index === rows.length - 1} onClick={() => handleReorder(index, 1)} className="text-kov-steel hover:text-kov-red disabled:opacity-30 transition-colors" aria-label="Descendre">
                      <ArrowDown size={13} />
                    </button>
                  </div>
                  <Link href={`/admin/content/${article.id}`} className="text-kov-steel hover:text-kov-red transition-colors" aria-label="Éditer">
                    <Pencil size={15} />
                  </Link>
                  <DeleteButton article={article} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
