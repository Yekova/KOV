"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Download, Loader2, Pencil, RotateCcw, Wand2, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { renderPromptMarkdown } from "@/lib/prompts/template";
import {
  exportPrompt,
  getPromptDetail,
  getPromptUsage,
  getPromptVersions,
  restorePromptVersion,
} from "./actions";
import { PromptDiff } from "./PromptDiff";
import { STATUS_LABELS, TOOL_LABELS, TYPE_LABELS, VARIABLE_TYPE_LABELS } from "./schema";

export type PreviewTab = "apercu" | "variables" | "versions" | "stats";

const TABS: { id: PreviewTab; label: string }[] = [
  { id: "apercu", label: "Aperçu" },
  { id: "variables", label: "Variables" },
  { id: "versions", label: "Versions" },
  { id: "stats", label: "Statistiques" },
];

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-kov-steel">{label}</p>
      <p className="text-kov-concrete text-xs mt-0.5">{value}</p>
    </div>
  );
}

export function PromptPreview({
  promptId,
  tab,
  onTabChange,
  onUse,
  onClose,
}: {
  promptId: string;
  tab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
  onUse: (id: string) => void;
  /** Fourni seulement quand la fiche est ouverte en superposition, sous
   *  1280 px de large : en trois colonnes il n'y a rien à fermer. */
  onClose?: () => void;
}) {
  const queryClient = useQueryClient();
  const [rendered, setRendered] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(null);

  const { data: prompt, isLoading } = useQuery({
    queryKey: ["prompt", promptId],
    queryFn: () => getPromptDetail(promptId),
  });

  const { data: versions } = useQuery({
    queryKey: ["prompt-versions", promptId],
    queryFn: () => getPromptVersions(promptId),
    enabled: tab === "versions",
  });

  const { data: usage } = useQuery({
    queryKey: ["prompt-usage", promptId],
    queryFn: () => getPromptUsage(promptId),
    enabled: tab === "stats",
  });

  const restore = useMutation({
    mutationFn: (versionId: string) => restorePromptVersion(promptId, versionId),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      queryClient.invalidateQueries({ queryKey: ["prompt", promptId] });
      queryClient.invalidateQueries({ queryKey: ["prompt-versions", promptId] });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setCompareId(null);
      toast.success("Version restaurée");
    },
    onError: () => toast.error("La restauration a échoué."),
  });

  async function copy() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast.success("Prompt copié");
    } catch {
      toast.error("La copie a échoué.");
    }
  }

  async function exportAs(format: "json" | "markdown") {
    const file = await exportPrompt(promptId, format);
    if (!file) return toast.error("Export impossible.");
    const blob = new Blob([file.body], {
      type: format === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-kov-steel text-sm p-5">
        <Loader2 size={15} className="animate-spin" /> Chargement…
      </div>
    );
  }

  if (!prompt) {
    return <p className="text-kov-steel text-sm p-5">Prompt introuvable.</p>;
  }

  const compared = versions?.find((version) => version.id === compareId) ?? null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--kov-border)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-kov-bone text-base leading-snug">{prompt.title}</h2>
            {prompt.description && <p className="text-kov-steel text-xs mt-1">{prompt.description}</p>}
          </div>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Fermer la fiche" className="text-kov-steel hover:text-kov-red transition-colors shrink-0">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => onUse(prompt.id)}
            className="inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-widest text-kov-white transition-colors"
            style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
          >
            <Wand2 size={13} /> Utiliser
          </button>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            <Copy size={13} /> Copier
          </button>
          <Link
            href={`/admin/prompts/${prompt.id}`}
            className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            <Pencil size={13} /> Modifier
          </Link>
        </div>
      </header>

      <nav className="flex gap-1 px-3 pt-3 shrink-0" aria-label="Sections de la fiche">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className="px-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors border-b-2"
            style={{
              color: tab === item.id ? "var(--kov-bone)" : "var(--kov-steel)",
              borderColor: tab === item.id ? "var(--kov-red)" : "transparent",
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
        {tab === "apercu" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Meta label="Type" value={TYPE_LABELS[prompt.type]} />
              <Meta label="Outil" value={TOOL_LABELS[prompt.targetTool]} />
              <Meta label="Catégorie" value={prompt.categoryName ?? "—"} />
              <Meta label="Statut" value={STATUS_LABELS[prompt.status]} />
              <Meta label="Version" value={`v${prompt.versionNumber}`} />
              <Meta label="Variables" value={prompt.variables.length} />
              <Meta label="Modifié" value={formatRelativeTime(prompt.updatedAt)} />
              <Meta label="Utilisations" value={prompt.usageCount} />
            </div>

            {(prompt.parentTitle || prompt.variantCount > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {prompt.parentTitle && <Meta label="Variante de" value={prompt.parentTitle} />}
                {prompt.variantCount > 0 && <Meta label="Variantes" value={prompt.variantCount} />}
              </div>
            )}

            {prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {prompt.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-[10px] uppercase tracking-widest border text-kov-steel"
                    style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-kov-steel">Contenu</p>
                <button
                  type="button"
                  onClick={() => setRendered((current) => !current)}
                  className="text-[10px] uppercase tracking-widest text-kov-steel hover:text-kov-bone transition-colors"
                >
                  {rendered ? "Voir la source" : "Voir rendu"}
                </button>
              </div>

              {rendered ? (
                <div
                  className="kov-prompt-markdown border overflow-x-auto"
                  style={{
                    borderColor: "var(--kov-border)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--kov-carbon)",
                    padding: "12px 14px",
                  }}
                  dangerouslySetInnerHTML={{ __html: renderPromptMarkdown(prompt.content) }}
                />
              ) : (
                <pre
                  className="border overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap"
                  style={{
                    borderColor: "var(--kov-border)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--kov-carbon)",
                    color: "var(--kov-concrete)",
                    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                    padding: "12px 14px",
                  }}
                >
                  {prompt.content}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => exportAs("markdown")}
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-kov-steel hover:text-kov-bone transition-colors"
              >
                <Download size={12} /> Export Markdown
              </button>
              <button
                type="button"
                onClick={() => exportAs("json")}
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-kov-steel hover:text-kov-bone transition-colors"
              >
                <Download size={12} /> Export JSON
              </button>
            </div>
          </>
        )}

        {tab === "variables" && (
          <>
            {prompt.variables.length === 0 ? (
              <p className="text-kov-steel text-sm">Ce prompt n&apos;a aucune variable déclarée.</p>
            ) : (
              <ul className="space-y-3">
                {prompt.variables.map((variable) => (
                  <li
                    key={variable.id}
                    className="border p-3"
                    style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-kov-bone text-xs">{`{{${variable.key}}}`}</code>
                      <span className="text-[10px] uppercase tracking-widest text-kov-steel">
                        {VARIABLE_TYPE_LABELS[variable.type]}
                        {variable.required && <span className="text-kov-red"> · requis</span>}
                      </span>
                    </div>
                    {variable.label && <p className="text-kov-concrete text-xs mt-1">{variable.label}</p>}
                    {variable.description && <p className="text-kov-steel text-xs mt-1">{variable.description}</p>}
                    {variable.options.length > 0 && (
                      <p className="text-kov-steel text-xs mt-1">Options : {variable.options.join(", ")}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "versions" && (
          <>
            {!versions ? (
              <p className="text-kov-steel text-sm">Chargement…</p>
            ) : (
              <ul className="space-y-2">
                {versions.map((version) => {
                  const isCurrent = version.versionNumber === prompt.versionNumber;
                  return (
                    <li
                      key={version.id}
                      className="border p-3"
                      style={{
                        borderColor: compareId === version.id ? "var(--kov-red)" : "var(--kov-border)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-kov-bone text-xs">
                          v{version.versionNumber}
                          {isCurrent && <span className="text-kov-steel"> · courante</span>}
                        </p>
                        <p className="text-kov-steel text-[11px]">{formatRelativeTime(version.createdAt)}</p>
                      </div>
                      {version.changeNote && <p className="text-kov-concrete text-xs mt-1">{version.changeNote}</p>}
                      {version.authorName && <p className="text-kov-steel text-[11px] mt-0.5">{version.authorName}</p>}

                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => setCompareId(compareId === version.id ? null : version.id)}
                          className="text-[10px] uppercase tracking-widest text-kov-steel hover:text-kov-bone transition-colors"
                        >
                          {compareId === version.id ? "Masquer" : "Comparer"}
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            disabled={restore.isPending}
                            onClick={() => {
                              if (window.confirm(`Restaurer la v${version.versionNumber} ? Elle deviendra la v${prompt.versionNumber + 1}, sans effacer l'historique.`)) {
                                restore.mutate(version.id);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-kov-steel hover:text-kov-red transition-colors disabled:opacity-50"
                          >
                            <RotateCcw size={11} /> Restaurer
                          </button>
                        )}
                      </div>

                      {compareId === version.id && compared && (
                        <div className="mt-3">
                          <p className="text-[10px] uppercase tracking-widest text-kov-steel mb-1.5">
                            v{compared.versionNumber} → v{prompt.versionNumber} (courante)
                          </p>
                          <PromptDiff before={compared.content} after={prompt.content} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {tab === "stats" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Meta label="Utilisations" value={prompt.usageCount} />
              <Meta label="Dernière" value={prompt.lastUsedAt ? formatRelativeTime(prompt.lastUsedAt) : "Jamais"} />
              {/* Une note moyenne n'existe que si quelqu'un a noté. Pas de
                  valeur de repli : un chiffre affiché par défaut serait un
                  chiffre inventé, et il servirait à décider. */}
              <Meta
                label="Note moyenne"
                value={prompt.averageRating === null ? "—" : `${prompt.averageRating} / 5`}
              />
              <Meta label="Avis" value={prompt.ratingCount} />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-kov-steel mb-2">Dernières utilisations</p>
              {!usage ? (
                <p className="text-kov-steel text-sm">Chargement…</p>
              ) : usage.length === 0 ? (
                <p className="text-kov-steel text-sm">Ce prompt n&apos;a encore jamais servi.</p>
              ) : (
                <ul className="space-y-2">
                  {usage.slice(0, 12).map((entry) => (
                    <li
                      key={entry.id}
                      className="border px-3 py-2 text-xs"
                      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-kov-concrete">
                          {entry.versionNumber ? `v${entry.versionNumber}` : "version supprimée"}
                          {entry.projectName && <span className="text-kov-steel"> · {entry.projectName}</span>}
                        </span>
                        <span className="text-kov-steel">{formatRelativeTime(entry.createdAt)}</span>
                      </div>
                      {Object.keys(entry.variables).length > 0 && (
                        <p className="text-kov-steel mt-1 truncate">
                          {Object.entries(entry.variables)
                            .map(([key, value]) => `${key} : ${value}`)
                            .join(" · ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
