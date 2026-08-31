"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Select } from "@/components/ui/Select";
import { createPost, updatePost } from "./actions";

const FIELD_CLASS =
  "w-full bg-transparent border py-2.5 px-3 text-kov-bone placeholder:text-kov-steel text-sm focus:outline-none focus:border-kov-red transition-colors";

export type PostFormValues = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  clientDisplayName: string | null;
  projectId: string | null;
  status: "draft" | "published";
  coverImageUrl: string | null;
};

export function PostForm({
  post,
  projects,
}: {
  post?: PostFormValues;
  projects: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        if (post) {
          await updatePost(post.id, formData);
        } else {
          await createPost(formData);
        }
        router.push("/admin/content");
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'enregistrement a échoué.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <GlassCard className="p-6 space-y-4" variant="solid">
        <label className="block text-xs text-kov-steel">
          Titre
          <input
            name="title"
            defaultValue={post?.title}
            required
            className={`${FIELD_CLASS} mt-1`}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </label>
        <label className="block text-xs text-kov-steel">
          Slug (URL)
          <input
            name="slug"
            defaultValue={post?.slug}
            placeholder="généré depuis le titre si laissé vide"
            className={`${FIELD_CLASS} mt-1`}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </label>
        <label className="block text-xs text-kov-steel">
          Extrait
          <textarea
            name="excerpt"
            defaultValue={post?.excerpt ?? ""}
            rows={2}
            placeholder="Résumé affiché dans la liste du journal"
            className={`${FIELD_CLASS} mt-1`}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </label>
        <label className="block text-xs text-kov-steel">
          Contenu
          <textarea
            name="body"
            defaultValue={post?.body}
            required
            rows={12}
            placeholder="Un paragraphe par ligne vide — pas de mise en forme riche pour l'instant."
            className={`${FIELD_CLASS} mt-1`}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </label>
      </GlassCard>

      <GlassCard className="p-6 space-y-4" variant="solid">
        <p className="text-xs uppercase tracking-widest text-kov-steel">Publication</p>
        <label className="block text-xs text-kov-steel">
          Image de couverture
          {post?.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImageUrl} alt="" className="w-full max-w-xs h-32 object-cover mt-2 mb-2" style={{ borderRadius: "var(--radius-sm)" }} />
          )}
          <input
            type="file"
            name="cover_image"
            accept="image/*"
            className="block text-kov-bone text-sm mt-1 file:mr-3 file:py-2 file:px-3 file:border-0 file:text-xs file:uppercase file:tracking-widest file:bg-kov-red file:text-white"
          />
        </label>
        <label className="block text-xs text-kov-steel">
          Projet lié (facultatif, usage interne uniquement)
          <Select
            name="project_id"
            defaultValue={post?.projectId ?? ""}
            options={[{ value: "", label: "— Aucun —" }, ...projects.map((p) => ({ value: p.id, label: p.label }))]}
            className={`${FIELD_CLASS} mt-1`}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </label>
        <label className="block text-xs text-kov-steel">
          Nom du client affiché publiquement (facultatif)
          <input
            name="client_display_name"
            defaultValue={post?.clientDisplayName ?? ""}
            placeholder="Ex. « Maison Dupont » — jamais rempli automatiquement, à toi de choisir ce qui est public"
            className={`${FIELD_CLASS} mt-1`}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </label>
        <label className="block text-xs text-kov-steel">
          Statut
          <Select
            name="status"
            defaultValue={post?.status ?? "draft"}
            options={[
              { value: "draft", label: "Brouillon" },
              { value: "published", label: "Publié" },
            ]}
            className={`${FIELD_CLASS} mt-1`}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </label>
      </GlassCard>

      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Enregistrement…" : post ? "Enregistrer" : "Créer l'article"}
        </Button>
        {error && <p className="text-kov-red text-sm">{error}</p>}
      </div>
    </form>
  );
}
