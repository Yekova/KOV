"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { humanizeKey } from "@/lib/prompts/template";
import { VARIABLE_TYPES, VARIABLE_TYPE_LABELS, type PromptVariableInput } from "./schema";

const FIELD =
  "w-full bg-transparent border px-2.5 py-1.5 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";
const FIELD_STYLE = { borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" } as const;
const LABEL = "text-[10px] uppercase tracking-widest text-kov-steel";

export function emptyVariable(key = ""): PromptVariableInput {
  return {
    key,
    label: key ? humanizeKey(key) : "",
    type: "text",
    defaultValue: "",
    placeholder: "",
    description: "",
    options: [],
    required: false,
  };
}

// L'ordre de cette liste est l'ordre du formulaire d'utilisation, et c'est
// la seule raison pour laquelle il est réglable : personne ne trie des
// variables pour le plaisir, on les trie pour que le formulaire se remplisse
// de haut en bas dans l'ordre où on y pense.
export function PromptVariablesEditor({
  variables,
  onChange,
}: {
  variables: PromptVariableInput[];
  onChange: (variables: PromptVariableInput[]) => void;
}) {
  function update(index: number, patch: Partial<PromptVariableInput>) {
    onChange(variables.map((variable, i) => (i === index ? { ...variable, ...patch } : variable)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= variables.length) return;
    const next = [...variables];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {variables.length === 0 && (
        <p className="text-kov-steel text-sm">
          Aucune variable déclarée. Écrivez <span className="font-mono text-kov-concrete">{"{{cle}}"}</span> dans le
          contenu, puis déclarez-la d&apos;un clic depuis l&apos;éditeur.
        </p>
      )}

      {variables.map((variable, index) => {
        const needsOptions = variable.type === "select" || variable.type === "multiselect";

        return (
          <div
            key={index}
            className="border p-3 space-y-3"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_1fr_10rem] gap-3">
                <div>
                  <label className={LABEL}>Clé</label>
                  <input
                    value={variable.key}
                    onChange={(event) => update(index, { key: event.target.value })}
                    className={`${FIELD} mt-1 font-mono`}
                    style={FIELD_STYLE}
                    placeholder="client_name"
                  />
                </div>
                <div>
                  <label className={LABEL}>Libellé</label>
                  <input
                    value={variable.label}
                    onChange={(event) => update(index, { label: event.target.value })}
                    className={`${FIELD} mt-1`}
                    style={FIELD_STYLE}
                    placeholder={variable.key ? humanizeKey(variable.key) : "Client"}
                  />
                </div>
                <div>
                  <label className={LABEL}>Type</label>
                  <select
                    value={variable.type}
                    onChange={(event) => update(index, { type: event.target.value as PromptVariableInput["type"] })}
                    className={`${FIELD} mt-1`}
                    style={{ ...FIELD_STYLE, background: "var(--kov-graphite)" }}
                  >
                    {VARIABLE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {VARIABLE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1 pt-5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="text-kov-steel hover:text-kov-bone transition-colors disabled:opacity-25"
                  aria-label={`Monter ${variable.key || "la variable"}`}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === variables.length - 1}
                  className="text-kov-steel hover:text-kov-bone transition-colors disabled:opacity-25"
                  aria-label={`Descendre ${variable.key || "la variable"}`}
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onChange(variables.filter((_, i) => i !== index))}
                className="text-kov-steel hover:text-kov-red transition-colors pt-5"
                aria-label={`Supprimer ${variable.key || "la variable"}`}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Valeur par défaut</label>
                <input
                  value={variable.defaultValue}
                  onChange={(event) => update(index, { defaultValue: event.target.value })}
                  className={`${FIELD} mt-1`}
                  style={FIELD_STYLE}
                />
              </div>
              <div>
                <label className={LABEL}>Indication dans le champ</label>
                <input
                  value={variable.placeholder}
                  onChange={(event) => update(index, { placeholder: event.target.value })}
                  className={`${FIELD} mt-1`}
                  style={FIELD_STYLE}
                />
              </div>
            </div>

            {needsOptions && (
              <div>
                <label className={LABEL}>Options, séparées par une virgule</label>
                <input
                  value={variable.options.join(", ")}
                  onChange={(event) =>
                    update(index, {
                      options: event.target.value
                        .split(",")
                        .map((option) => option.trim())
                        .filter(Boolean),
                    })
                  }
                  className={`${FIELD} mt-1`}
                  style={FIELD_STYLE}
                  placeholder="Premium, Corporate, Immersif"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-kov-concrete text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={variable.required}
                  onChange={(event) => update(index, { required: event.target.checked })}
                  className="accent-kov-red"
                />
                Obligatoire
              </label>
              <input
                value={variable.description}
                onChange={(event) => update(index, { description: event.target.value })}
                className={`${FIELD} flex-1 min-w-[12rem]`}
                style={FIELD_STYLE}
                placeholder="Aide affichée sous le champ"
              />
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => onChange([...variables, emptyVariable()])}
        className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      >
        <Plus size={14} /> Ajouter une variable
      </button>
    </div>
  );
}
