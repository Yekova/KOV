"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Maximize2, Minimize2, RefreshCw, Sparkles, Search, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Select } from "@/components/ui/Select";
import { RichEditor } from "@/components/admin/content/RichEditor";
import { ImagePicker } from "@/components/admin/content/ImagePicker";
import { createPost, updatePost, getArticleById, getArticles } from "./actions";
import { postInputSchema, type PostInput } from "./schema";

const FIELD_CLASS =
  "w-full bg-transparent border py-2.5 px-3 text-kov-bone placeholder:text-kov-steel text-sm focus:outline-none focus:border-kov-red transition-colors";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // strip combining accents (NFD splits e.g. "é" into "e" + a combining mark)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function wordCountToReadingTime(html: string): string {
  const wordCount = html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min`;
}

const DEFAULT_VALUES: PostInput = {
  title: "",
  excerpt: "",
  body: "",
  image: "",
  tag: "",
  dateLabel: "",
  readingTime: "1 min",
  featured: false,
  status: "draft",
  slug: "",
  metaTitle: "",
  metaDescription: "",
  authorName: "",
  audioUrl: "",
  projectId: "",
  clientDisplayName: "",
};

function CollapsibleSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <GlassCard variant="solid" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-xs uppercase tracking-widest text-kov-steel">{title}</span>
        <ChevronDown
          size={16}
          className="text-kov-steel transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </GlassCard>
  );
}

function AiButton({ label, onClick, pending }: { label: string; onClick: () => void; pending: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-kov-steel hover:text-kov-red transition-colors disabled:opacity-50"
      title="Nécessite une clé API IA à configurer côté serveur — pas encore branché."
    >
      <Sparkles size={12} className={pending ? "animate-pulse" : ""} />
      {label}
    </button>
  );
}

export function PostForm({ postId, projects }: { postId?: string; projects: { id: string; label: string }[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!postId;

  const { data: existing, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["article", postId],
    queryFn: () => getArticleById(postId as string),
    enabled: isEdit,
  });

  const { data: allArticles } = useQuery({ queryKey: ["articles"], queryFn: getArticles });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PostInput>({
    resolver: zodResolver(postInputSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);
  const [relatedQuery, setRelatedQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Injecting async-loaded data into the form once it arrives (see spec:
  // useQuery(['article', id]) + useEffect + reset(data)) — this is exactly
  // what this effect is for, syncing the form to an external data source
  // (TanStack Query's cache) once it resolves. reset() itself isn't a
  // useState setter the linter can see, but relatedIds/slugManuallyEdited
  // are plain useState here and need the same sync, hence the disables
  // below rather than a workaround that would just obscure the same thing.
  useEffect(() => {
    if (!existing) return;
    reset({
      title: existing.title,
      excerpt: existing.excerpt ?? "",
      body: existing.body,
      image: existing.image ?? "",
      tag: existing.tag ?? "",
      dateLabel: existing.dateLabel ?? "",
      readingTime: existing.readingTime ?? "1 min",
      featured: existing.featured,
      status: existing.status,
      slug: existing.slug,
      metaTitle: existing.metaTitle ?? "",
      metaDescription: existing.metaDescription ?? "",
      authorName: existing.authorName ?? "",
      audioUrl: existing.audioUrl ?? "",
      projectId: existing.projectId ?? "",
      clientDisplayName: existing.clientDisplayName ?? "",
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRelatedIds(existing.relatedPostIds);
    // An existing article already has a real slug — don't silently rewrite
    // it just because reset() sets `title` too and the sync effect below
    // would otherwise fire on it.
    setSlugManuallyEdited(true);
  }, [existing, reset]);

  const title = useWatch({ control, name: "title" });
  useEffect(() => {
    if (!slugManuallyEdited) setValue("slug", slugify(title || ""));
  }, [title, slugManuallyEdited, setValue]);

  const body = useWatch({ control, name: "body" });
  useEffect(() => {
    setValue("readingTime", wordCountToReadingTime(body || ""));
  }, [body, setValue]);

  const slug = useWatch({ control, name: "slug" });
  const audioUrl = useWatch({ control, name: "audioUrl" });

  const mutation = useMutation({
    mutationFn: (data: PostInput) => (isEdit ? updatePost(postId as string, data, relatedIds) : createPost(data, relatedIds)),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success(isEdit ? "Article mis à jour" : "Article créé");
      router.push("/admin/content");
    },
    onError: () => toast.error("L'enregistrement a échoué."),
  });

  function onSubmit(data: PostInput) {
    mutation.mutate(data);
  }

  function handleAiStub(label: string) {
    toast.info(`${label} — bientôt disponible (nécessite une clé API IA côté serveur).`);
  }

  const relatedResults = relatedQuery.trim()
    ? (allArticles ?? []).filter(
        (a) => a.id !== postId && !relatedIds.includes(a.id) && a.title.toLowerCase().includes(relatedQuery.trim().toLowerCase())
      )
    : [];

  if (isEdit && isLoadingExisting) {
    return (
      <div className="space-y-4 max-w-6xl">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse" style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-md)" }} />
        ))}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={isFullscreen ? "fixed inset-0 z-50 flex flex-col bg-[var(--kov-black)] p-6" : "space-y-6"}
      style={isFullscreen ? { background: "var(--kov-black)" } : undefined}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-kov-bone text-2xl uppercase">{isEdit ? "Modifier l'article" : "Nouvel article"}</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="text-kov-steel hover:text-kov-bone transition-colors p-2"
            aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <Button type="submit" variant="primary" disabled={isSubmitting || mutation.isPending}>
            {isSubmitting || mutation.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isFullscreen ? "flex-1 min-h-0" : ""}`}>
        <div className={`lg:col-span-2 space-y-4 ${isFullscreen ? "flex flex-col min-h-0" : ""}`}>
          <GlassCard variant="solid" className="p-6 space-y-4">
            <label className="block text-xs text-kov-steel">
              Titre
              <input {...register("title")} className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
              {errors.title && <p className="text-kov-red text-xs mt-1">{errors.title.message}</p>}
            </label>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-kov-steel">Extrait</span>
                <AiButton label="IA — Résumer" onClick={() => handleAiStub("Résumé IA")} pending={false} />
              </div>
              <textarea
                {...register("excerpt")}
                rows={3}
                className={FIELD_CLASS}
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              />
              {errors.excerpt && <p className="text-kov-red text-xs mt-1">{errors.excerpt.message}</p>}
            </div>
          </GlassCard>

          <div className={isFullscreen ? "flex-1 min-h-0 flex flex-col" : ""}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-kov-steel">Contenu</span>
              <AiButton label="IA — Reformater" onClick={() => handleAiStub("Reformatage IA")} pending={false} />
            </div>
            <Controller
              name="body"
              control={control}
              render={({ field }) => (
                <div className={isFullscreen ? "flex-1 min-h-0" : ""}>
                  <RichEditor value={field.value ?? ""} onChange={field.onChange} fullscreen={isFullscreen} />
                </div>
              )}
            />
          </div>
        </div>

        <div className={`space-y-4 ${isFullscreen ? "overflow-y-auto" : ""}`}>
          <GlassCard variant="solid" className="p-5 space-y-4">
            <Controller
              name="image"
              control={control}
              render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} error={errors.image?.message} />}
            />

            <label className="block text-xs text-kov-steel">
              Catégorie
              <input {...register("tag")} placeholder="Ex. Fiscalité" className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
              {errors.tag && <p className="text-kov-red text-xs mt-1">{errors.tag.message}</p>}
            </label>

            <label className="block text-xs text-kov-steel">
              Date affichée
              <input {...register("dateLabel")} placeholder="Ex. Juillet 2025" className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
              {errors.dateLabel && <p className="text-kov-red text-xs mt-1">{errors.dateLabel.message}</p>}
            </label>

            <label className="block text-xs text-kov-steel">
              Temps de lecture
              <input {...register("readingTime")} placeholder="Ex. 5 min" className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
              {errors.readingTime && <p className="text-kov-red text-xs mt-1">{errors.readingTime.message}</p>}
              <span className="text-kov-steel text-[10px]">Recalculé automatiquement depuis le contenu — modifiable à la main.</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-kov-steel">
              <input type="checkbox" {...register("featured")} className="accent-kov-red w-4 h-4" />
              Mettre à la une
            </label>

            <label className="block text-xs text-kov-steel">
              Statut
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: "draft", label: "Brouillon" },
                      { value: "published", label: "Publié" },
                    ]}
                    className={`${FIELD_CLASS} mt-1`}
                    style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                  />
                )}
              />
            </label>

            <label className="block text-xs text-kov-steel">
              Projet lié (facultatif, usage interne)
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="— Aucun —"
                    options={projects.map((p) => ({ value: p.id, label: p.label }))}
                    className={`${FIELD_CLASS} mt-1`}
                    style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                  />
                )}
              />
            </label>

            <label className="block text-xs text-kov-steel">
              Nom du client affiché publiquement (facultatif)
              <input {...register("clientDisplayName")} className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
            </label>
          </GlassCard>

          <CollapsibleSection title="SEO">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-kov-steel">Slug (URL)</span>
              <button
                type="button"
                onClick={() => {
                  setSlugManuallyEdited(false);
                  setValue("slug", slugify(title || ""));
                }}
                className="text-kov-steel hover:text-kov-red transition-colors"
                title="Régénérer depuis le titre"
              >
                <RefreshCw size={13} />
              </button>
            </div>
            <input
              {...register("slug", {
                onChange: () => setSlugManuallyEdited(true),
              })}
              maxLength={80}
              className={FIELD_CLASS}
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            />
            <p className="text-kov-steel text-[10px]">/journal/{slug || "…"}</p>
            {errors.slug && <p className="text-kov-red text-xs">{errors.slug.message}</p>}

            <SeoCounterField label="Titre SEO" name="metaTitle" max={60} register={register} control={control} errors={errors} />
            <SeoCounterField label="Description SEO" name="metaDescription" max={155} register={register} control={control} errors={errors} textarea />

            <label className="block text-xs text-kov-steel">
              Auteur (JSON-LD)
              <input {...register("authorName")} className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
            </label>
          </CollapsibleSection>

          <CollapsibleSection title="Audio">
            <label className="block text-xs text-kov-steel">
              URL audio (MP3/OGG)
              <input {...register("audioUrl")} placeholder="https://…" className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
              {errors.audioUrl && <p className="text-kov-red text-xs mt-1">{errors.audioUrl.message}</p>}
            </label>
            {audioUrl && <audio controls src={audioUrl} className="w-full" />}
          </CollapsibleSection>

          <CollapsibleSection title={`Articles liés (${relatedIds.length}/3)`}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kov-steel" />
              <input
                value={relatedQuery}
                onChange={(e) => setRelatedQuery(e.target.value)}
                placeholder="Rechercher un article…"
                disabled={relatedIds.length >= 3}
                className={`${FIELD_CLASS} pl-9 disabled:opacity-50`}
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              />
            </div>

            {relatedResults.length > 0 && (
              <ul className="border max-h-40 overflow-y-auto" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
                {relatedResults.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setRelatedIds((prev) => (prev.length < 3 ? [...prev, a.id] : prev));
                        setRelatedQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-kov-bone text-sm hover:text-kov-red transition-colors"
                    >
                      {a.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {relatedIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {relatedIds.map((id) => {
                  const article = allArticles?.find((a) => a.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-kov-bone border"
                      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
                    >
                      {article?.title ?? id}
                      <button type="button" onClick={() => setRelatedIds((prev) => prev.filter((x) => x !== id))} aria-label="Retirer">
                        <X size={12} className="text-kov-steel hover:text-kov-red transition-colors" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </CollapsibleSection>
        </div>
      </div>
    </form>
  );
}

function SeoCounterField({
  label,
  name,
  max,
  textarea,
  register,
  control,
  errors,
}: {
  label: string;
  name: "metaTitle" | "metaDescription";
  max: number;
  textarea?: boolean;
  register: UseFormRegister<PostInput>;
  control: Control<PostInput>;
  errors: FieldErrors<PostInput>;
}) {
  const value = useWatch({ control, name }) ?? "";
  const over = value.length > max;
  return (
    <label className="block text-xs text-kov-steel">
      <span className="flex items-center justify-between">
        {label}
        <span style={{ color: over ? "var(--kov-red)" : "var(--kov-steel)" }}>
          {value.length}/{max}
        </span>
      </span>
      {textarea ? (
        <textarea {...register(name)} rows={3} className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
      ) : (
        <input {...register(name)} className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
      )}
      {errors[name] && <p className="text-kov-red text-xs mt-1">{errors[name]?.message as string}</p>}
    </label>
  );
}
