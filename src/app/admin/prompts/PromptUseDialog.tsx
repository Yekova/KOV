"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Loader2,
  MessageCircleQuestion,
  Rows3,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { renderTemplate } from "@/lib/prompts/template";
import {
  getPromptProjectOptions,
  logPromptUsage,
  savePromptVariant,
  submitPromptFeedback,
  type PromptDetail,
  type PromptVariableRow,
} from "./actions";

const FIELD =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";
const FIELD_STYLE = { borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" } as const;
const LABEL = "text-[11px] uppercase tracking-widest text-kov-steel";

/** Ce qu'on écrit dans le texte pour un booléen. Le gabarit attend une
 *  chaîne : « true » dans une phrase française ne veut rien dire. */
const BOOLEAN_VALUES = { on: "oui", off: "non" };

/** Un champ, rendu une seule fois pour les deux modes.
 *
 *  C'est tout l'intérêt de l'avoir extrait : le formulaire complet et
 *  l'entretien question par question affichent rigoureusement le même
 *  champ, avec les mêmes options et le même comportement. Deux rendus
 *  parallèles auraient divergé au premier type de variable ajouté. */
function VariableField({
  variable,
  value,
  onChange,
  autoFocus = false,
  onEnter,
}: {
  variable: PromptVariableRow;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  /** En mode entretien, Entrée passe à la question suivante. Jamais sur un
   *  champ multiligne, où Entrée sert à écrire. */
  onEnter?: () => void;
}) {
  const id = `var-${variable.id}`;
  const keyDown = onEnter
    ? (event: React.KeyboardEvent) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onEnter();
        }
      }
    : undefined;

  if (variable.type === "textarea" || variable.type === "code") {
    return (
      <textarea
        id={id}
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={variable.type === "code" ? 6 : 4}
        placeholder={variable.placeholder}
        className={`${FIELD} mt-1 ${variable.type === "code" ? "font-mono text-xs" : ""}`}
        style={FIELD_STYLE}
      />
    );
  }

  if (variable.type === "select") {
    return (
      <select
        id={id}
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
    );
  }

  if (variable.type === "multiselect") {
    const selected = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    return (
      <div className="flex flex-wrap gap-2 mt-1.5">
        {variable.options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() =>
                onChange((active ? selected.filter((item) => item !== option) : [...selected, option]).join(", "))
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
    );
  }

  if (variable.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-kov-concrete text-sm mt-1.5 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={value === BOOLEAN_VALUES.on}
          onChange={(event) => onChange(event.target.checked ? BOOLEAN_VALUES.on : BOOLEAN_VALUES.off)}
          className="accent-kov-red"
        />
        {value === BOOLEAN_VALUES.on ? "Oui" : "Non"}
      </label>
    );
  }

  return (
    <input
      id={id}
      autoFocus={autoFocus}
      type={variable.type === "number" ? "number" : variable.type === "url" ? "url" : "text"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={keyDown}
      placeholder={variable.placeholder}
      className={`${FIELD} mt-1`}
      style={FIELD_STYLE}
    />
  );
}

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

  // Une question à la fois au-delà de trois variables, sinon le formulaire
  // entier. Poser une question unique quand il n'y en a qu'une à poser
  // ajoute une cérémonie pour rien ; en poser six d'un coup est le mur qui
  // fait abandonner. Le choix reste renversable d'un clic dans les deux sens.
  const [interview, setInterview] = useState(prompt.variables.length >= 3);
  const [step, setStep] = useState(0);

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

  const setValue = (key: string, next: string) => setValues((current) => ({ ...current, [key]: next }));

  // Une étape de plus que de variables : la dernière porte le rattachement
  // au projet et le bouton de génération.
  const lastStep = prompt.variables.length;
  const current = prompt.variables[step];
  const currentBlocked = Boolean(current?.required && !values[current.key]?.trim());

  async function generate() {
    if (missingRequired.length) {
      toast.error(`À remplir : ${missingRequired.join(", ")}`);
      if (interview) {
        const index = prompt.variables.findIndex((variable) => variable.key === missingRequired[0]);
        if (index >= 0) setStep(index);
      }
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

  const ProjectField = (
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
  );

  const GenerateButton = (
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
  );

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

          <div className="flex items-center gap-3 shrink-0">
            {generated === null && prompt.variables.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setInterview((mode) => !mode);
                  setStep(0);
                }}
                className="inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] uppercase tracking-widest text-kov-steel transition-colors hover:text-kov-bone hover:border-kov-red"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              >
                {interview ? <Rows3 size={12} /> : <MessageCircleQuestion size={12} />}
                {interview ? "Tout voir" : "Entretien"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="text-kov-steel hover:text-kov-red transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {generated !== null ? (
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
                onClick={() => {
                  setGenerated(null);
                  setStep(0);
                }}
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

            <div className="border-t pt-4 flex flex-wrap items-end gap-3" style={{ borderColor: "var(--kov-border)" }}>
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
        ) : interview && prompt.variables.length > 0 ? (
          /* ── Mode entretien ───────────────────────────────────────── */
          <div className="p-5 space-y-5">
            <div>
              <div className="flex items-center justify-between text-[11px] text-kov-steel tabular-nums">
                <span>
                  {step < lastStep ? `Question ${step + 1} sur ${lastStep}` : "Dernier point"}
                </span>
                {current?.required && <span style={{ color: "var(--kov-red)" }}>Obligatoire</span>}
              </div>
              <div className="h-px mt-2" style={{ background: "var(--kov-border)" }}>
                <div
                  className="h-px transition-all duration-300"
                  style={{ background: "var(--kov-red)", width: `${((step + 1) / (lastStep + 1)) * 100}%` }}
                />
              </div>
            </div>

            {step < lastStep && current ? (
              <div className="min-h-[9rem]">
                <label className="text-kov-bone text-base block" htmlFor={`var-${current.id}`}>
                  {current.label || current.key}
                </label>
                {current.description && <p className="text-kov-steel text-xs mt-1">{current.description}</p>}
                <div className="mt-3">
                  <VariableField
                    variable={current}
                    value={values[current.key] ?? ""}
                    onChange={(next) => setValue(current.key, next)}
                    autoFocus
                    onEnter={() => {
                      if (!currentBlocked) setStep((s) => Math.min(s + 1, lastStep));
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="min-h-[9rem] space-y-4">
                {ProjectField}
                {/* Le récapitulatif : c'est le moment où l'on relit ce qu'on
                    a répondu, ce qu'un formulaire donne gratuitement et
                    qu'un entretien doit rendre explicitement. */}
                <div className="border-t pt-3" style={{ borderColor: "var(--kov-border)" }}>
                  <p className={LABEL}>Vos réponses</p>
                  <ul className="mt-2 space-y-1">
                    {prompt.variables.map((variable, index) => (
                      <li key={variable.id} className="flex items-start gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setStep(index)}
                          className="text-kov-steel hover:text-kov-bone transition-colors shrink-0"
                        >
                          {variable.label || variable.key} ↩
                        </button>
                        <span className="text-kov-concrete truncate">
                          {values[variable.key]?.trim() || <span className="text-kov-steel">non renseigné</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(s - 1, 0))}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors disabled:opacity-30"
              >
                <ArrowLeft size={14} /> Retour
              </button>

              <div className="ml-auto flex items-center gap-3">
                {step < lastStep ? (
                  <>
                    {!current?.required && (
                      <button
                        type="button"
                        onClick={() => setStep((s) => s + 1)}
                        className="text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors"
                      >
                        Passer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStep((s) => s + 1)}
                      disabled={currentBlocked}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-widest text-kov-white transition-colors disabled:opacity-40"
                      style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
                    >
                      Suivant <ArrowRight size={14} />
                    </button>
                  </>
                ) : (
                  GenerateButton
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Mode formulaire ──────────────────────────────────────── */
          <div className="p-5 space-y-4">
            {prompt.variables.length === 0 && (
              <p className="text-kov-concrete text-sm">Ce prompt n&apos;a pas de variable : il sera généré tel quel.</p>
            )}

            {prompt.variables.map((variable) => (
              <div key={variable.id}>
                <label className={LABEL} htmlFor={`var-${variable.id}`}>
                  {variable.label || variable.key}
                  {variable.required && <span className="text-kov-red"> *</span>}
                </label>
                <VariableField
                  variable={variable}
                  value={values[variable.key] ?? ""}
                  onChange={(next) => setValue(variable.key, next)}
                />
                {variable.description && <p className="text-kov-steel text-xs mt-1">{variable.description}</p>}
              </div>
            ))}

            {ProjectField}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors"
              >
                Annuler
              </button>
              {GenerateButton}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
