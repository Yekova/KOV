"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, Loader2, Pencil, Send, Star, Trash2, Undo2 } from "lucide-react";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  deleteShowcaseProject,
  getShowcaseProjects,
  reorderShowcaseProjects,
  setShowcasePublication,
  type ShowcaseRow,
} from "./actions";

const KIND_LABELS: Record<ShowcaseRow["kind"], string> = {
  live: "Livré",
  upcoming: "À venir",
  invitation: "Invitation",
};

function Skeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse"
          style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}
        />
      ))}
    </div>
  );
}

function DeleteButton({ project }: { project: ShowcaseRow }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteShowcaseProject(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcase"] });
      toast.success("Réalisation supprimée");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "La suppression a échoué."),
  });

  return (
    <button
      type="button"
      disabled={mutation.isPending}
      onClick={() => {
        if (window.confirm(`Supprimer « ${project.name} » ? Cette action est irréversible.`)) mutation.mutate();
      }}
      className="text-kov-steel hover:text-kov-red transition-colors disabled:opacity-50"
      aria-label={`Supprimer ${project.name}`}
    >
      {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  );
}

function PublishButton({ project }: { project: ShowcaseRow }) {
  const queryClient = useQueryClient();
  const next = project.publication === "published" ? "draft" : "published";
  const mutation = useMutation({
    mutationFn: () => setShowcasePublication(project.id, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcase"] });
      toast.success(next === "published" ? "Réalisation publiée" : "Repassée en brouillon");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Le changement de statut a échoué."),
  });

  return (
    <button
      type="button"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      className="text-kov-steel hover:text-kov-red transition-colors disabled:opacity-50"
      aria-label={next === "published" ? `Publier ${project.name}` : `Repasser ${project.name} en brouillon`}
      title={next === "published" ? "Publier" : "Repasser en brouillon"}
    >
      {mutation.isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : next === "published" ? (
        <Send size={16} />
      ) : (
        <Undo2 size={16} />
      )}
    </button>
  );
}

export function ShowcaseList() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useQuery({ queryKey: ["showcase"], queryFn: getShowcaseProjects });

  const reorder = useMutation({
    mutationFn: reorderShowcaseProjects,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["showcase"] }),
    onError: () => toast.error("Le réordonnancement a échoué."),
  });

  if (isLoading) return <Skeleton />;
  if (!projects || projects.length === 0) {
    return <EmptyState message="Aucune réalisation. La première donnera son contenu à /projets." />;
  }

  // The whole order is sent, not a swapped pair. A pair swap writes two rows
  // and trusts every other row's existing value; sending the list the admin
  // is actually looking at cannot drift from it.
  function move(index: number, direction: -1 | 1) {
    if (!projects) return;
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;
    const next = [...projects];
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((project) => project.id));
  }

  return (
    <div className="border" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-xs uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
            <th className="px-4 py-3 w-16">Ordre</th>
            <th className="px-4 py-3">Réalisation</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Surfaces</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3 w-40 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <tr
              key={project.id}
              className="group border-b last:border-0"
              style={{ borderColor: "var(--kov-border)" }}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reorder.isPending}
                    className="text-kov-steel hover:text-kov-bone transition-colors disabled:opacity-25"
                    aria-label={`Monter ${project.name}`}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === projects.length - 1 || reorder.isPending}
                    className="text-kov-steel hover:text-kov-bone transition-colors disabled:opacity-25"
                    aria-label={`Descendre ${project.name}`}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </td>

              <td className="px-4 py-3">
                <Link href={`/admin/realisations/${project.id}`} className="text-kov-bone hover:text-kov-red transition-colors">
                  <span className="font-mono text-xs text-kov-steel mr-2">{project.reference}</span>
                  {project.name}
                  {project.featured && <Star size={12} className="inline ml-2 text-kov-red" aria-label="Mise en avant" />}
                </Link>
                <p className="text-kov-steel text-xs mt-0.5">{project.category}</p>
              </td>

              <td className="px-4 py-3 text-kov-concrete text-xs uppercase tracking-widest">
                {KIND_LABELS[project.kind]}
              </td>

              {/* Which public surfaces this row reaches. /projets always
                  lists everything, so only the homepage is a choice. */}
              <td className="px-4 py-3 text-kov-steel text-xs">
                /projets{project.showOnHome ? " · accueil" : ""}
              </td>

              <td className="px-4 py-3">
                <StatusBadge
                  label={project.publication === "published" ? "Publié" : "Brouillon"}
                  tone={project.publication === "published" ? "positive" : "neutral"}
                />
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/projets/preview/${project.id}`}
                    target="_blank"
                    className="text-kov-steel hover:text-kov-red transition-colors"
                    aria-label={`Aperçu de ${project.name}`}
                    title="Aperçu"
                  >
                    <Eye size={16} />
                  </Link>
                  <PublishButton project={project} />
                  <Link
                    href={`/admin/realisations/${project.id}`}
                    className="text-kov-steel hover:text-kov-red transition-colors"
                    aria-label={`Modifier ${project.name}`}
                    title="Modifier"
                  >
                    <Pencil size={16} />
                  </Link>
                  <DeleteButton project={project} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
