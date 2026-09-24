"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, Download, Loader2, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { renderTemplate } from "@/lib/prompts/template";
import { getPromptProjectOptions, logPromptUsage, savePromptVariant, submitPromptFeedback, type PromptDetail } from "./actions";

const FIELD =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";
const FIELD_STYLE = { borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" } as const;
const LABEL = "text-[11px] uppercase tracking-widest text-kov-steel";

/** Ce qu'on écrit dans le texte pour un booléen. Le gabarit attend une
 *  chaîne : « true » dans une phrase française ne veut rien dire. */
const BOOLEAN_VALUES = { on: "oui", off: "non" };

export function PromptUseDialog({ prompt, onClose }: { prompt: PromptDetail; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(prompt.variables.map((variable) => [variable.key, variable.defaultValue]))
  );
  const [projectId, setProjectId] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [unfilled, setUnfilled] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [variantTitle, setVariantTitle] = useState("");

  const { data: projects } = useQuery({ queryKey: ["prompt-projects"], queryFn: getPromptProjectOptions });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const missingRequired = useMemo(
    () => prompt.variables.filter((variable) => variable.required && !values[variable.key]?.trim()).map((v) => v.key),
    [prompt.variables, values]
  );

  async function generate() {
    if (missingRequired.length) {
      toast.error(`À remplir : ${missingRequired.join(", ")}`);
      return;
    }
    setBusy(true);
    const result = renderTemplate(prompt.content, values);
    setGenerated(result.output);
    setUnfilled(result.unfilled);

    // Le journal est écrit à la génération, pas à la copie : c'est le geste
    // qui produit le texte, et une copie peut très bien ne jamais venir.
    const logged = await logPromptUsage({ promptId: prompt.id, values, projectId: projectId || undefined });
    setBusy(false);
    if (logged.error) toast.error(logged.error);
  }

  async function copy() {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
      toast.success("Prompt copié");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("La copie a échoué — sélectionnez le texte à la main.");
    }
  }

  function download() {
    if (!generated) return;
    const blob = new Blob([generated], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${prompt.slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function saveVariant() {
    if (!generated) return;
    if (!variantTitle.trim()) {
      toast.error("Donnez un nom à la variante.");
      return;
    }
    setBusy(true);
    const result = await savePromptVariant(prompt.id, variantTitle, generated);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Variante enregistrée");
    setVariantTitle("");
  }

  async function sendFeedback(verdict: "up" | "down") {
    const result = await submitPromptFeedback({ promptId: prompt.id, verdict });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setFeedbackSent(true);
    toast.success("Merci — noté.");
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Utiliser ${prompt.title}`}
      className="fixed inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.78)" }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-3xl border my-auto"
        style={{
          borderColor: "var(--kov-border)",
          borderRadius: "var(--radius-lg)",
          background: "var(--kov-graphite)",
        }}
      >
        <header
          className="flex items-start justify-between gap-4 px-5 py-4 border-b"
          style={{ borderColor: "var(--kov-border)" }}
        >
          <div className="min-w-0">
            <p className={LABEL}>{generated === null ? "Utiliser" : "Prompt final"}</p>
            <h2 className="text-kov-bone text-lg mt-0.5 truncate">{prompt.title}</h2>
            <p className="text-kov-steel text-xs mt-0.5 tabular-nums">
              v{prompt.versionNumber} · {prompt.variables.length} variable{prompt.variables.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-kov-steel hover:text-kov-red transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </header>

        {generated === null ? (
          <div className="p-5 space-y-4">
            {prompt.variables.length === 0 && (
              <p className="text-kov-concrete text-sm">
                Ce prompt n&apos;a pas de variable : il sera généré tel quel.
              </p>
            )}

            {prompt.variables.map((variable) => {
              const label = variable.label || variable.key;
              const value = values[variable.key] ?? "";
              const setValue = (next: string) => setValues((current) => ({ ...current, [variable.key]: next }));

              return (
                <div key={variable.id}>
                  <label className={LABEL} htmlFor={`var-${variable.id}`}>
                    {label}
                    {variable.required && <span className="text-kov-red"> *</span>}
                  </label>

                  {variable.type === "textarea" || variable.type === "code" ? (
                    <textarea
                      id={`var-${variable.id}`}
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      rows={variable.type === "code" ? 6 : 3}
                      placeholder={variable.placeholder}
                      className={`${FIELD} mt-1 ${variable.type === "code" ? "font-mono text-xs" : ""}`}
                      style={FIELD_STYLE}
                    />
                  ) : variable.type === "select" ? (
                    <select
                      id={`var-${variable.id}`}
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      className={`${FIELD} mt-1`}
                      style={{ ...FIELD_STYLE, background: "var(--kov-graphite)" }}
                    >
                      <option value="">—</option>
                      {variable.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : variable.type === "multiselect" ? (
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {variable.options.map((option) => {
                        const selected = value
                          .split(",")
                          .map((part) => part.trim())
                          .filter(Boolean);
                        const active = selected.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setValue(
                                (active ? selected.filter((item) => item !== option) : [...selected, option]).join(", ")
                              )
                            }
                            className="px-3 py-1.5 text-xs border transition-colors"
                            style={{
                              borderColor: active ? "var(--kov-red)" : "var(--kov-border)",
                              color: active ? "var(--kov-red)" : "var(--kov-concrete)",
                              borderRadius: "var(--radius-pill)",
                            }}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  ) : variable.type === "boolean" ? (
                    <label className="flex items-center gap-2 text-kov-concrete text-sm mt-1.5 cursor-pointer">
                      <input
                        id={`var-${variable.id}`}
                        type="checkbox"
                        checked={value === BOOLEAN_VALUES.on}
                        onChange={(event) => setValue(event.target.checked ? BOOLEAN_VALUES.on : BOOLEAN_VALUES.off)}
                        className="accent-kov-red"
                      />
                      {value === BOOLEAN_VALUES.on ? "Oui" : "Non"}
                    </label>
                  ) : (
                    <input
                      id={`var-${variable.id}`}
                      type={variable.type === "number" ? "number" : variable.type === "url" ? "url" : "text"}
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      placeholder={variable.placeholder}
                      className={`${FIELD} mt-1`}
                      style={FIELD_STYLE}
                    />
                  )}

                  {variable.description && <p className="text-kov-steel text-xs mt-1">{variable.description}</p>}
                </div>
              );
            })}

            <div>
              <label className={LABEL} htmlFor="prompt-use-project">
                Rattacher à un projet
              </label>
              <select
                id="prompt-use-project"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className={`${FIELD} mt-1`}
                style={{ ...FIELD_STYLE, background: "var(--kov-graphite)" }}
              >
                <option value="">Aucun</option>
                {(projects ?? []).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.label}
                  </option>
                ))}
              </select>
              <p className="text-kov-steel text-xs mt-1">
                Facultatif. Sert à retrouver plus tard quelle version a servi sur quel chantier.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors">
                Annuler
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-widest text-kov-white transition-colors disabled:opacity-50"
                style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                Générer
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {unfilled.length > 0 && (
              <p className="text-xs" style={{ color: "var(--kov-red-signal)" }}>
                Laissées vides, et donc restées visibles dans le texte :{" "}
                <span className="font-mono">{unfilled.join(", ")}</span>
              </p>
            )}

            <pre
              className="border overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap"
              style={{
                borderColor: "var(--kov-border)",
                borderRadius: "var(--radius-sm)",
                background: "var(--kov-carbon)",
                color: "var(--kov-concrete)",
                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                padding: "14px 16px",
                maxHeight: "44vh",
              }}
            >
              {generated}
            </pre>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-widest text-kov-white transition-colors"
                style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copié" : "Copier"}
              </button>
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-2 border px-4 py-2.5 text-xs uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              >
                <Download size={14} /> Markdown
              </button>
              <button
                type="button"
                onClick={() => setGenerated(null)}
                className="inline-flex items-center gap-2 text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors"
              >
                <ArrowLeft size={14} /> Revenir aux variables
              </button>

              {/* Le retour se demande ici, à la seconde où on sait si le
                  prompt a servi. Dans une fiche, personne n'y revient. */}
              <div className="ml-auto flex items-center gap-2">
                {feedbackSent ? (
                  <span className="text-kov-steel text-xs">Retour enregistré</span>
                ) : (
                  <>
                    <span className="text-kov-steel text-xs">Utile ?</span>
                    <button
                      type="button"
                      onClick={() => sendFeedback("up")}
                      aria-label="Ce prompt a été utile"
                      className="text-kov-steel hover:text-kov-bone transition-colors"
                    >
                      <ThumbsUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => sendFeedback("down")}
                      aria-label="Ce prompt est à améliorer"
                      className="text-kov-steel hover:text-kov-red transition-colors"
                    >
                      <ThumbsDown size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div
              className="border-t pt-4 flex flex-wrap items-end gap-3"
              style={{ borderColor: "var(--kov-border)" }}
            >
              <div className="flex-1 min-w-[14rem]">
                <label className={LABEL} htmlFor="variant-title">
                  Enregistrer comme variante
                </label>
                <input
                  id="variant-title"
                  value={variantTitle}
                  onChange={(event) => setVariantTitle(event.target.value)}
                  placeholder={`${prompt.title} — variante`}
                  className={`${FIELD} mt-1`}
                  style={FIELD_STYLE}
                />
              </div>
              <button
                type="button"
                onClick={saveVariant}
                disabled={busy || !variantTitle.trim()}
                className="border px-4 py-2.5 text-xs uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red disabled:opacity-40"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
