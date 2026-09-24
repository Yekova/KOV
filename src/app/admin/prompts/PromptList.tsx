"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Ellipsis, Loader2, Star, Wand2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  deletePrompt,
  duplicatePrompt,
  getPromptDetail,
  setPromptStatus,
  togglePromptFavorite,
  type PromptListItem,
} from "./actions";
import { togglePromptCollection, type PromptCollectionRow } from "./library-actions";
import { STATUS_LABELS, TOOL_LABELS, TYPE_LABELS } from "./schema";

function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-widest border shrink-0"
      style={{
        borderColor: tone === "accent" ? "var(--kov-red)" : "var(--kov-border)",
        color: tone === "accent" ? "var(--kov-red)" : "var(--kov-steel)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {children}
    </span>
  );
}

/** Le menu « … » d'une ligne.
 *
 *  Fermé au clic extérieur et à Échap — un menu qu'on ne peut refermer
 *  qu'en rechoisissant une action est un piège, et c'est le défaut le plus
 *  courant des menus faits à la main. */
function RowMenu({
  prompt,
  collections,
  onOpenHistory,
}: {
  prompt: PromptListItem;
  collections: PromptCollectionRow[];
  onOpenHistory: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["prompts"] });

  const duplicate = useMutation({
    mutationFn: () => duplicatePrompt(prompt.id),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      invalidate();
      toast.success("Prompt dupliqué");
    },
    onError: () => toast.error("La duplication a échoué."),
  });

  const archive = useMutation({
    mutationFn: () => setPromptStatus(prompt.id, prompt.status === "archived" ? "active" : "archived"),
    onSuccess: () => {
      invalidate();
      toast.success(prompt.status === "archived" ? "Prompt réactivé" : "Prompt archivé");
    },
    onError: () => toast.error("Le changement de statut a échoué."),
  });

  const remove = useMutation({
    mutationFn: () => deletePrompt(prompt.id),
    onSuccess: () => {
      invalidate();
      toast.success("Prompt supprimé");
    },
    onError: () => toast.error("La suppression a échoué."),
  });

  const collect = useMutation({
    mutationFn: (collectionId: string) => togglePromptCollection(prompt.id, collectionId),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      invalidate();
      toast.success(result.added ? "Ajouté à la collection" : "Retiré de la collection");
    },
  });

  const ITEM =
    "w-full text-left px-3 py-2 text-xs text-kov-concrete hover:bg-white/[0.05] hover:text-kov-bone transition-colors";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Autres actions pour ${prompt.title}`}
        aria-expanded={open}
        className="text-kov-steel hover:text-kov-bone transition-colors p-1"
      >
        <Ellipsis size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-56 border py-1 z-20"
          style={{
            borderColor: "var(--kov-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--kov-graphite)",
            boxShadow: "0 24px 48px -24px rgba(0,0,0,0.9)",
          }}
        >
          <Link href={`/admin/prompts/${prompt.id}`} className={`${ITEM} block`} onClick={() => setOpen(false)}>
            Modifier
          </Link>
          <button type="button" className={ITEM} onClick={() => { setOpen(false); duplicate.mutate(); }}>
            Dupliquer
          </button>
          <button type="button" className={ITEM} onClick={() => { setOpen(false); onOpenHistory(); }}>
            Historique des versions
          </button>

          {collections.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-kov-steel">Collections</p>
              <div className="max-h-40 overflow-y-auto">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    className={`${ITEM} flex items-center justify-between gap-2`}
                    onClick={() => collect.mutate(collection.id)}
                  >
                    <span className="truncate">{collection.name}</span>
                    {prompt.collectionIds.includes(collection.id) && <span className="text-kov-red">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="my-1 border-t" style={{ borderColor: "var(--kov-border)" }} />
          <button type="button" className={ITEM} onClick={() => { setOpen(false); archive.mutate(); }}>
            {prompt.status === "archived" ? "Réactiver" : "Archiver"}
          </button>
          {/* La suppression est le seul geste irréversible de ce menu : elle
              est en bas, séparée, et demande confirmation. */}
          <button
            type="button"
            className={`${ITEM} hover:text-kov-red`}
            onClick={() => {
              setOpen(false);
              if (window.confirm(`Supprimer « ${prompt.title} » ? L'historique et le journal partiront avec.`)) {
                remove.mutate();
              }
            }}
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

export function PromptList({
  prompts,
  collections,
  selectedId,
  onSelect,
  onUse,
  onOpenHistory,
  isLoading,
}: {
  prompts: PromptListItem[];
  collections: PromptCollectionRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUse: (id: string) => void;
  onOpenHistory: (id: string) => void;
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();

  const favorite = useMutation({
    mutationFn: (id: string) => togglePromptFavorite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompts"] }),
    onError: () => toast.error("La mise à jour du favori a échoué."),
  });

  async function copyContent(id: string, title: string) {
    // La liste ne transporte pas le contenu — elle n'en a pas besoin pour
    // s'afficher, et 400 prompts de plusieurs kilo-octets seraient
    // téléchargés à chaque frappe dans la recherche. On va le chercher au
    // moment où il sert vraiment.
    const detail = await getPromptDetail(id);
    if (!detail) return toast.error("Prompt introuvable.");
    try {
      await navigator.clipboard.writeText(detail.content);
      toast.success(`« ${title} » copié`);
    } catch {
      toast.error("La copie a échoué.");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse"
            style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}
          />
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div
        className="border border-dashed p-10 text-center"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      >
        <p className="text-kov-bone text-sm">Aucun prompt ne correspond.</p>
        <p className="text-kov-steel text-sm mt-2">Changez de filtre, ou créez-en un.</p>
        <Link
          href="/admin/prompts/new"
          className="mt-5 inline-flex items-center gap-2 border px-4 py-2.5 text-[11px] uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          Créer un prompt
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {prompts.map((prompt) => {
        const active = prompt.id === selectedId;
        return (
          <li key={prompt.id}>
            <div
              className="group border p-3 transition-colors"
              style={{
                borderColor: active ? "var(--kov-red)" : "var(--kov-border)",
                borderRadius: "var(--radius-sm)",
                background: active ? "rgba(227,30,36,0.04)" : "transparent",
              }}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onSelect(prompt.id)}
                  className="flex-1 min-w-0 text-left"
                  aria-current={active ? "true" : undefined}
                >
                  <p className="text-kov-bone text-sm truncate">{prompt.title}</p>
                  {prompt.description && (
                    <p className="text-kov-steel text-xs mt-0.5 line-clamp-1">{prompt.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Chip tone="accent">{TYPE_LABELS[prompt.type]}</Chip>
                    {prompt.categoryName && <Chip>{prompt.categoryName}</Chip>}
                    <Chip>{TOOL_LABELS[prompt.targetTool]}</Chip>
                    {prompt.status !== "active" && <Chip>{STATUS_LABELS[prompt.status]}</Chip>}
                    {prompt.tags.slice(0, 2).map((tag) => (
                      <Chip key={tag}>{tag}</Chip>
                    ))}
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => favorite.mutate(prompt.id)}
                    aria-label={prompt.favorite ? `Retirer ${prompt.title} des favoris` : `Mettre ${prompt.title} en favori`}
                    className="transition-colors p-1"
                    style={{ color: prompt.favorite ? "var(--kov-red)" : "var(--kov-steel)" }}
                  >
                    {favorite.isPending && favorite.variables === prompt.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Star size={15} fill={prompt.favorite ? "currentColor" : "none"} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyContent(prompt.id, prompt.title)}
                    aria-label={`Copier ${prompt.title}`}
                    className="text-kov-steel hover:text-kov-bone transition-colors p-1"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUse(prompt.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest text-kov-white transition-colors"
                    style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
                  >
                    <Wand2 size={12} /> Utiliser
                  </button>
                  <RowMenu prompt={prompt} collections={collections} onOpenHistory={() => onOpenHistory(prompt.id)} />
                </div>
              </div>

              <p className="text-kov-steel text-[11px] mt-2 tabular-nums">
                {prompt.variableCount} variable{prompt.variableCount > 1 ? "s" : ""} · v{prompt.versionNumber} ·{" "}
                {prompt.usageCount > 0
                  ? `${prompt.usageCount} utilisation${prompt.usageCount > 1 ? "s" : ""}`
                  : "jamais utilisé"}{" "}
                · {formatRelativeTime(prompt.updatedAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
