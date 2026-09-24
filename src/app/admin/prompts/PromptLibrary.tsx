"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Search, Sparkles, Upload, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getPromptDetail, getPrompts, importPrompt, type PromptFilters } from "./actions";
import {
  getPromptCategories,
  getPromptCollections,
  getPromptTags,
  installStarterLibrary,
} from "./library-actions";
import { PromptList } from "./PromptList";
import { PromptPreview, type PreviewTab } from "./PromptPreview";
import { PromptSidebar } from "./PromptSidebar";
import { PromptUseDialog } from "./PromptUseDialog";
import { PROMPT_STATUSES, PROMPT_TYPES, STATUS_LABELS, TARGET_TOOLS, TOOL_LABELS, TYPE_LABELS } from "./schema";

const SELECT =
  "bg-transparent border px-2.5 py-2 text-kov-concrete text-xs focus:outline-none focus:border-kov-red transition-colors";
const SELECT_STYLE = {
  borderColor: "var(--kov-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--kov-graphite)",
} as const;

/** La frappe ne doit pas déclencher une requête par caractère. Le délai est
 *  posé dans un setTimeout, donc l'état n'est pas écrit pendant l'effet —
 *  ce que le compilateur React refuse à juste titre. */
function useDebounced<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function ImportDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [format, setFormat] = useState<"json" | "markdown">("markdown");
  const [payload, setPayload] = useState("");

  const run = useMutation({
    mutationFn: () => importPrompt(payload, format),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Prompt importé en brouillon");
      onClose();
    },
    onError: () => toast.error("L'import a échoué."),
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Importer un prompt"
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.78)" }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xl border p-5 space-y-4"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-lg)", background: "var(--kov-graphite)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-kov-bone text-sm uppercase tracking-widest">Importer un prompt</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-kov-steel hover:text-kov-red transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2">
          {(["markdown", "json"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFormat(option)}
              className="px-3 py-1.5 text-[11px] uppercase tracking-widest border transition-colors"
              style={{
                borderColor: format === option ? "var(--kov-red)" : "var(--kov-border)",
                color: format === option ? "var(--kov-red)" : "var(--kov-steel)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <textarea
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          rows={12}
          placeholder={format === "json" ? '{ "title": "…", "content": "…" }' : "# Titre\n\nContenu du prompt…"}
          className="w-full bg-transparent border px-3 py-2 text-kov-bone text-xs font-mono focus:outline-none focus:border-kov-red transition-colors"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />

        <p className="text-kov-steel text-xs">
          Le prompt arrive en brouillon. Les variables d&apos;un Markdown sont déduites de son contenu et créées en
          texte court — leur type se règle ensuite.
        </p>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => run.mutate()}
            disabled={run.isPending || !payload.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-widest text-kov-white transition-colors disabled:opacity-50"
            style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
          >
            {run.isPending && <Loader2 size={14} className="animate-spin" />}
            Importer
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ce que propose une bibliothèque vide — voir installStarterLibrary(). */
function InstallPanel() {
  const queryClient = useQueryClient();
  const install = useMutation({
    mutationFn: installStarterLibrary,
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      queryClient.invalidateQueries();
      toast.success(`${result.prompts} prompts et ${result.blocks} blocs installés`);
    },
    onError: () => toast.error("L'installation a échoué."),
  });

  return (
    <div
      className="border border-dashed p-10 text-center"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
    >
      <p className="text-kov-bone text-sm">La bibliothèque est vide.</p>
      <p className="text-kov-steel text-sm mt-2 max-w-md mx-auto leading-relaxed">
        Vous pouvez partir de zéro, ou poser une base : huit gabarits écrits pour cette base de code, avec leurs
        variables, plus sept blocs réutilisables pour le Builder. Tout est modifiable et supprimable.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
        <button
          type="button"
          disabled={install.isPending}
          onClick={() => install.mutate()}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-widest text-kov-white transition-colors disabled:opacity-50"
          style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
        >
          {install.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Installer la base de départ
        </button>
        <Link
          href="/admin/prompts/new"
          className="inline-flex items-center gap-2 border px-4 py-2.5 text-[11px] uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          <Plus size={14} /> Créer le premier prompt
        </Link>
      </div>
    </div>
  );
}

export function PromptLibrary() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<PromptFilters>({ sort: "recent" });
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebounced(rawQuery);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("apercu");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [useId, setUseId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const wide = useMediaQuery("(min-width: 1280px)");

  const effectiveFilters = useMemo(() => ({ ...filters, query }), [filters, query]);

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["prompts", effectiveFilters],
    queryFn: () => getPrompts(effectiveFilters),
  });
  const { data: categories } = useQuery({ queryKey: ["prompt-categories"], queryFn: getPromptCategories });
  const { data: collections } = useQuery({ queryKey: ["prompt-collections"], queryFn: getPromptCollections });
  const { data: tags } = useQuery({ queryKey: ["prompt-tags"], queryFn: getPromptTags });

  const { data: usePrompt } = useQuery({
    queryKey: ["prompt", useId],
    queryFn: () => getPromptDetail(useId as string),
    enabled: Boolean(useId),
  });

  // La palette de commandes ouvre /admin/prompts?use=<id>. Un lien plutôt
  // qu'un raccourci clavier caché : il est partageable, il survit à un
  // rechargement, et il ne demande pas d'apprendre Maj+Entrée.
  const requestedUseId = searchParams.get("use");
  const [lastRequestedUseId, setLastRequestedUseId] = useState<string | null>(null);
  if (requestedUseId && requestedUseId !== lastRequestedUseId) {
    setLastRequestedUseId(requestedUseId);
    setUseId(requestedUseId);
  }

  // Sélection automatique de la première ligne, ajustée pendant le rendu
  // plutôt que dans un effet — c'est un ajustement d'état à une donnée qui
  // change, pas un effet de bord, et c'est le motif que Nav.tsx et
  // GlobalAdminSearch suivent déjà ici.
  const listKey = (prompts ?? []).map((prompt) => prompt.id).join(",");
  const [lastListKey, setLastListKey] = useState<string | null>(null);
  if (prompts && listKey !== lastListKey) {
    setLastListKey(listKey);
    if (!selectedId || !prompts.some((prompt) => prompt.id === selectedId)) {
      setSelectedId(prompts[0]?.id ?? null);
    }
  }

  const unfiltered =
    !query && !filters.categoryId && !filters.collectionId && !filters.tagSlug && !filters.favoritesOnly && !filters.status;

  // « Récemment utilisés » se déduit de la liste déjà chargée, et n'apparaît
  // que lorsqu'elle est complète : une bande de raccourcis calculée sur un
  // sous-ensemble filtré dirait autre chose que ce qu'elle annonce.
  const recentlyUsed = useMemo(() => {
    if (!unfiltered || !prompts) return [];
    return prompts
      .filter((prompt) => prompt.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt as string).getTime() - new Date(a.lastUsedAt as string).getTime())
      .slice(0, 5);
  }, [prompts, unfiltered]);

  const patch = (next: Partial<PromptFilters>) => setFilters((current) => ({ ...current, ...next }));

  function select(id: string) {
    setSelectedId(id);
    setPreviewTab("apercu");
    if (!wide) setOverlayOpen(true);
  }

  function openHistory(id: string) {
    setSelectedId(id);
    setPreviewTab("versions");
    if (!wide) setOverlayOpen(true);
  }

  const libraryIsEmpty = !isLoading && prompts?.length === 0 && unfiltered;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_24rem]">
        <div className="hidden lg:block">
          <PromptSidebar
            categories={categories ?? []}
            collections={collections ?? []}
            tags={tags ?? []}
            filters={filters}
            onChange={patch}
            total={prompts?.length ?? 0}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[12rem]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-kov-steel pointer-events-none" />
              <input
                value={rawQuery}
                onChange={(event) => setRawQuery(event.target.value)}
                placeholder="Rechercher un prompt, une variable, un mot du contenu…"
                aria-label="Rechercher dans la bibliothèque"
                className="w-full bg-transparent border pl-9 pr-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              />
            </div>

            {/* Sous lg, le rail est masqué : la catégorie revient ici, en
                liste déroulante, plutôt que de disparaître. */}
            <select
              value={filters.categoryId ?? ""}
              onChange={(event) => patch({ categoryId: event.target.value, collectionId: "", tagSlug: "" })}
              aria-label="Catégorie"
              className={`${SELECT} lg:hidden`}
              style={SELECT_STYLE}
            >
              <option value="">Toutes catégories</option>
              {(categories ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={filters.type ?? ""}
              onChange={(event) => patch({ type: event.target.value })}
              aria-label="Type"
              className={SELECT}
              style={SELECT_STYLE}
            >
              <option value="">Tout type</option>
              {PROMPT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>

            <select
              value={filters.targetTool ?? ""}
              onChange={(event) => patch({ targetTool: event.target.value })}
              aria-label="Outil"
              className={SELECT}
              style={SELECT_STYLE}
            >
              <option value="">Tout outil</option>
              {TARGET_TOOLS.map((tool) => (
                <option key={tool} value={tool}>
                  {TOOL_LABELS[tool]}
                </option>
              ))}
            </select>

            <select
              value={filters.status ?? ""}
              onChange={(event) => patch({ status: event.target.value })}
              aria-label="Statut"
              className={SELECT}
              style={SELECT_STYLE}
            >
              <option value="">Actifs et brouillons</option>
              {PROMPT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            <select
              value={filters.sort ?? "recent"}
              onChange={(event) => patch({ sort: event.target.value as PromptFilters["sort"] })}
              aria-label="Tri"
              className={SELECT}
              style={SELECT_STYLE}
            >
              <option value="recent">Récemment modifiés</option>
              <option value="used">Récemment utilisés</option>
              <option value="usage">Les plus utilisés</option>
              <option value="title">Alphabétique</option>
            </select>

            <button
              type="button"
              onClick={() => setImporting(true)}
              className="inline-flex items-center gap-1.5 border px-3 py-2 text-[11px] uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            >
              <Upload size={13} /> Importer
            </button>
          </div>

          {recentlyUsed.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-kov-steel mb-2">Récemment utilisés</p>
              <div className="flex flex-wrap gap-2">
                {recentlyUsed.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => setUseId(prompt.id)}
                    className="inline-flex items-center gap-2 border px-3 py-1.5 text-xs text-kov-concrete transition-colors hover:border-kov-red hover:text-kov-bone"
                    style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
                  >
                    {prompt.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {libraryIsEmpty ? (
            <InstallPanel />
          ) : (
            <PromptList
              prompts={prompts ?? []}
              collections={collections ?? []}
              selectedId={selectedId}
              onSelect={select}
              onUse={setUseId}
              onOpenHistory={openHistory}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Troisième colonne à partir de 1280 px seulement. En dessous, la
            même fiche s'ouvre en superposition : trois colonnes sur un écran
            de portable donnent trois colonnes illisibles. */}
        <div className="hidden xl:block">
          {/* `wide &&` en plus de la classe : sans lui, la fiche serait bien
              masquée en CSS sous 1280 px mais monterait quand même, et irait
              chercher le détail d'un prompt que personne ne regarde. */}
          {wide && selectedId && (
            <div
              className="sticky top-6 border overflow-hidden"
              style={{
                borderColor: "var(--kov-border)",
                borderRadius: "var(--radius-sm)",
                background: "var(--kov-graphite)",
                height: "calc(100vh - 9rem)",
              }}
            >
              <PromptPreview promptId={selectedId} tab={previewTab} onTabChange={setPreviewTab} onUse={setUseId} />
            </div>
          )}
        </div>
      </div>

      {!wide && overlayOpen && selectedId && (
        <div
          className="fixed inset-0 flex items-stretch justify-end"
          style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }}
          onClick={() => setOverlayOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg border-l"
            style={{ borderColor: "var(--kov-border)", background: "var(--kov-graphite)" }}
          >
            <PromptPreview
              promptId={selectedId}
              tab={previewTab}
              onTabChange={setPreviewTab}
              onUse={setUseId}
              onClose={() => setOverlayOpen(false)}
            />
          </div>
        </div>
      )}

      {useId && usePrompt && <PromptUseDialog prompt={usePrompt} onClose={() => setUseId(null)} />}
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </>
  );
}
