"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createPrompt, getPromptDetail, getPrompts, updatePrompt } from "./actions";
import { getPromptCategories, getPromptCollections } from "./library-actions";
import { PromptEditor } from "./PromptEditor";
import { PromptVariablesEditor, emptyVariable } from "./PromptVariablesEditor";
import {
  EMPTY_PROMPT,
  PROMPT_STATUSES,
  PROMPT_TYPES,
  STATUS_HINTS,
  STATUS_LABELS,
  TARGET_TOOLS,
  TOOL_LABELS,
  TYPE_LABELS,
  promptInputSchema,
  type PromptInput,
} from "./schema";

const FIELD =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";
const FIELD_STYLE = { borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" } as const;
const SELECT_STYLE = { ...FIELD_STYLE, background: "var(--kov-graphite)" } as const;
const LABEL = "text-[11px] uppercase tracking-widest text-kov-steel";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="border p-5 space-y-4"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
    >
      <h2 className="font-display text-kov-bone text-sm uppercase tracking-widest">{title}</h2>
      {children}
    </section>
  );
}

export function PromptForm({ promptId }: { promptId?: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["prompt", promptId],
    queryFn: () => getPromptDetail(promptId as string),
    enabled: Boolean(promptId),
  });
  const { data: categories } = useQuery({ queryKey: ["prompt-categories"], queryFn: getPromptCategories });
  const { data: collections } = useQuery({ queryKey: ["prompt-collections"], queryFn: getPromptCollections });
  const { data: allPrompts } = useQuery({ queryKey: ["prompts", { sort: "title" }], queryFn: () => getPrompts({ sort: "title" }) });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PromptInput>({
    resolver: zodResolver(promptInputSchema),
    defaultValues: EMPTY_PROMPT,
  });

  useEffect(() => {
    if (!existing) return;
    reset({
      title: existing.title,
      slug: existing.slug,
      description: existing.description,
      content: existing.content,
      categoryId: existing.categoryId ?? "",
      type: existing.type,
      targetTool: existing.targetTool,
      status: existing.status,
      parentPromptId: existing.parentPromptId ?? "",
      tags: existing.tags,
      collectionIds: existing.collectionIds,
      variables: existing.variables.map((variable) => ({
        key: variable.key,
        label: variable.label,
        type: variable.type,
        defaultValue: variable.defaultValue,
        placeholder: variable.placeholder,
        description: variable.description,
        options: variable.options,
        required: variable.required,
      })),
      changeNote: "",
    });
  }, [existing, reset]);

  // useWatch et non watch() : le compilateur React saute entièrement un
  // composant qui appelle le second. PostForm et ShowcaseForm font pareil.
  const content = useWatch({ control, name: "content" }) ?? "";
  const variables = useWatch({ control, name: "variables" }) ?? [];
  const status = useWatch({ control, name: "status" }) ?? "draft";
  const selectedCollections = useWatch({ control, name: "collectionIds" }) ?? [];

  async function onSubmit(input: PromptInput) {
    setSaving(true);
    setError(null);
    const result = promptId ? await updatePrompt(promptId, input) : await createPrompt(input);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(promptId ? "Prompt enregistré" : "Prompt créé");
    router.push("/admin/prompts");
  }

  if (promptId && isLoading) {
    return (
      <div className="flex items-center gap-2 text-kov-steel text-sm">
        <Loader2 size={16} className="animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Identité">
            <div>
              <label className={LABEL}>Titre</label>
              <input {...register("title")} className={`${FIELD} mt-1`} style={FIELD_STYLE} />
              {errors.title && <p className="text-kov-red text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className={LABEL}>Description courte</label>
              <input
                {...register("description")}
                className={`${FIELD} mt-1`}
                style={FIELD_STYLE}
                placeholder="Ce que ce prompt produit, en une ligne."
              />
              {errors.description && <p className="text-kov-red text-xs mt-1">{errors.description.message}</p>}
            </div>
          </Section>

          <Section title="Contenu">
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <PromptEditor
                  value={field.value}
                  onChange={field.onChange}
                  declaredKeys={variables.map((variable) => variable.key).filter(Boolean)}
                  // Déclarer depuis l'éditeur, au moment où l'écart se voit.
                  // Obliger à descendre dans une autre section pour recopier
                  // une clé à la main est exactement ce qui produit la
                  // dérive entre le texte et les déclarations.
                  onDeclare={(key) => setValue("variables", [...variables, emptyVariable(key)], { shouldDirty: true })}
                />
              )}
            />
            {errors.content && <p className="text-kov-red text-xs mt-1">{errors.content.message}</p>}
          </Section>

          <Section title="Variables">
            <Controller
              control={control}
              name="variables"
              render={({ field }) => <PromptVariablesEditor variables={field.value} onChange={field.onChange} />}
            />
            {errors.variables && (
              <p className="text-kov-red text-xs mt-1">
                Vérifiez les clés des variables : lettres, chiffres, tiret, point et souligné uniquement.
              </p>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Classement">
            <div>
              <label className={LABEL}>Catégorie</label>
              <select {...register("categoryId")} className={`${FIELD} mt-1`} style={SELECT_STYLE}>
                <option value="">—</option>
                {(categories ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Type</label>
                <select {...register("type")} className={`${FIELD} mt-1`} style={SELECT_STYLE}>
                  {PROMPT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Outil</label>
                <select {...register("targetTool")} className={`${FIELD} mt-1`} style={SELECT_STYLE}>
                  {TARGET_TOOLS.map((tool) => (
                    <option key={tool} value={tool}>
                      {TOOL_LABELS[tool]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <div>
                  <label className={LABEL}>Tags, séparés par une virgule</label>
                  <input
                    value={field.value.join(", ")}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                      )
                    }
                    className={`${FIELD} mt-1`}
                    style={FIELD_STYLE}
                    placeholder="nextjs, supabase, responsive"
                  />
                </div>
              )}
            />

            {(collections ?? []).length > 0 && (
              <Controller
                control={control}
                name="collectionIds"
                render={({ field }) => (
                  <div>
                    <label className={LABEL}>Collections</label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {(collections ?? []).map((collection) => {
                        const active = selectedCollections.includes(collection.id);
                        return (
                          <button
                            key={collection.id}
                            type="button"
                            onClick={() =>
                              field.onChange(
                                active
                                  ? field.value.filter((id) => id !== collection.id)
                                  : [...field.value, collection.id]
                              )
                            }
                            className="px-3 py-1.5 text-[11px] border transition-colors"
                            style={{
                              borderColor: active ? "var(--kov-red)" : "var(--kov-border)",
                              color: active ? "var(--kov-red)" : "var(--kov-concrete)",
                              borderRadius: "var(--radius-pill)",
                            }}
                          >
                            {collection.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              />
            )}
          </Section>

          <Section title="Publication">
            <div>
              <label className={LABEL}>Statut</label>
              <select {...register("status")} className={`${FIELD} mt-1`} style={SELECT_STYLE}>
                {PROMPT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
              <p className="text-kov-steel text-xs mt-1">{STATUS_HINTS[status]}</p>
            </div>

            <div>
              <label className={LABEL}>Variante de</label>
              <select {...register("parentPromptId")} className={`${FIELD} mt-1`} style={SELECT_STYLE}>
                <option value="">Aucun — c&apos;est un prompt maître</option>
                {(allPrompts ?? [])
                  .filter((prompt) => prompt.id !== promptId)
                  .map((prompt) => (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className={LABEL}>Slug</label>
              <input
                {...register("slug")}
                className={`${FIELD} mt-1 font-mono text-xs`}
                style={FIELD_STYLE}
                placeholder="Dérivé du titre si vide"
              />
              {errors.slug && <p className="text-kov-red text-xs mt-1">{errors.slug.message}</p>}
            </div>

            {promptId && (
              <div>
                <label className={LABEL}>Note de version</label>
                <input
                  {...register("changeNote")}
                  className={`${FIELD} mt-1`}
                  style={FIELD_STYLE}
                  placeholder="Ce qui change dans cette version"
                />
                <p className="text-kov-steel text-xs mt-1">
                  Une version n&apos;est créée que si le contenu a changé. Renommer ou reclasser n&apos;en crée pas.
                </p>
              </div>
            )}
          </Section>
        </div>
      </div>

      {error && <p className="text-kov-red text-sm">{error}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest text-kov-white transition-colors disabled:opacity-50"
          style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {promptId ? "Enregistrer" : "Créer le prompt"}
        </button>
        <Link href="/admin/prompts" className="text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors">
          Annuler
        </Link>
        <span className="text-kov-steel text-xs ml-auto tabular-nums">
          {content.length} caractères · {variables.length} variable{variables.length > 1 ? "s" : ""}
        </span>
      </div>
    </form>
  );
}
