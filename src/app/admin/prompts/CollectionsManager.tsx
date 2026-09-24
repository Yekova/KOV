"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createPromptCategory,
  createPromptCollection,
  deletePromptCategory,
  deletePromptCollection,
  getPromptCategories,
  getPromptCollections,
  renamePromptCategory,
  reorderPromptCategories,
} from "./library-actions";

const FIELD =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";
const FIELD_STYLE = { borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" } as const;

function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section
      className="border p-5 space-y-4"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
    >
      <div>
        <h2 className="font-display text-kov-bone text-sm uppercase tracking-widest">{title}</h2>
        <p className="text-kov-steel text-xs mt-1">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function CategoriesPanel() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useQuery({ queryKey: ["prompt-categories"], queryFn: getPromptCategories });
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["prompt-categories"] });

  const create = useMutation({
    mutationFn: () => createPromptCategory(name),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      setName("");
      invalidate();
      toast.success("Catégorie créée");
    },
  });

  const rename = useMutation({
    mutationFn: () => renamePromptCategory(editingId as string, editingName),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      setEditingId(null);
      invalidate();
      toast.success("Catégorie renommée");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePromptCategory(id),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Catégorie supprimée");
    },
  });

  const reorder = useMutation({
    mutationFn: reorderPromptCategories,
    onSuccess: invalidate,
    onError: () => toast.error("Le réordonnancement a échoué."),
  });

  function move(index: number, direction: -1 | 1) {
    if (!categories) return;
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((category) => category.id));
  }

  return (
    <Panel
      title="Catégories"
      hint="Le classement métier d'un prompt. Un prompt n'en a qu'une, et l'ordre ici est l'ordre du rail de gauche."
    >
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nouvelle catégorie"
          className={FIELD}
          style={FIELD_STYLE}
        />
        <button
          type="button"
          onClick={() => create.mutate()}
          disabled={create.isPending || !name.trim()}
          className="inline-flex items-center gap-1.5 border px-3 py-2 text-[11px] uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red disabled:opacity-40 shrink-0"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          {create.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Ajouter
        </button>
      </div>

      {isLoading ? (
        <p className="text-kov-steel text-sm">Chargement…</p>
      ) : (
        <ul className="space-y-1">
          {(categories ?? []).map((category, index) => (
            <li
              key={category.id}
              className="flex items-center gap-2 border px-3 py-2"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || reorder.isPending}
                  className="text-kov-steel hover:text-kov-bone transition-colors disabled:opacity-25"
                  aria-label={`Monter ${category.name}`}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === (categories?.length ?? 0) - 1 || reorder.isPending}
                  className="text-kov-steel hover:text-kov-bone transition-colors disabled:opacity-25"
                  aria-label={`Descendre ${category.name}`}
                >
                  <ArrowDown size={12} />
                </button>
              </div>

              {editingId === category.id ? (
                <input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") rename.mutate();
                    if (event.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="flex-1 bg-transparent border px-2 py-1 text-kov-bone text-sm focus:outline-none focus:border-kov-red"
                  style={FIELD_STYLE}
                />
              ) : (
                <span className="flex-1 text-kov-bone text-sm truncate">{category.name}</span>
              )}

              <span className="text-kov-steel text-xs tabular-nums">{category.count}</span>

              {editingId === category.id ? (
                <button
                  type="button"
                  onClick={() => rename.mutate()}
                  className="text-kov-steel hover:text-kov-bone transition-colors"
                  aria-label="Valider"
                >
                  <Check size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(category.id);
                    setEditingName(category.name);
                  }}
                  className="text-kov-steel hover:text-kov-bone transition-colors"
                  aria-label={`Renommer ${category.name}`}
                >
                  <Pencil size={14} />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  // Le message dit ce qui arrive vraiment : la clé étrangère
                  // est en set null, donc les prompts survivent, déclassés.
                  const warning = category.count
                    ? `Supprimer « ${category.name} » ? Ses ${category.count} prompts resteront, sans catégorie.`
                    : `Supprimer « ${category.name} » ?`;
                  if (window.confirm(warning)) remove.mutate(category.id);
                }}
                className="text-kov-steel hover:text-kov-red transition-colors"
                aria-label={`Supprimer ${category.name}`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function CollectionsPanel() {
  const queryClient = useQueryClient();
  const { data: collections, isLoading } = useQuery({ queryKey: ["prompt-collections"], queryFn: getPromptCollections });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const create = useMutation({
    mutationFn: () => createPromptCollection(name, description),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["prompt-collections"] });
      toast.success("Collection créée");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePromptCollection(id),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      queryClient.invalidateQueries({ queryKey: ["prompt-collections"] });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Collection supprimée");
    },
  });

  return (
    <Panel
      title="Collections"
      hint="Transversales aux catégories : un client, un chantier, un thème. Un prompt peut appartenir à plusieurs."
    >
      <div className="space-y-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom de la collection"
          className={FIELD}
          style={FIELD_STYLE}
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (facultatif)"
          className={FIELD}
          style={FIELD_STYLE}
        />
        <button
          type="button"
          onClick={() => create.mutate()}
          disabled={create.isPending || !name.trim()}
          className="inline-flex items-center gap-1.5 border px-3 py-2 text-[11px] uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red disabled:opacity-40"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          {create.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Créer
        </button>
      </div>

      {isLoading ? (
        <p className="text-kov-steel text-sm">Chargement…</p>
      ) : (collections ?? []).length === 0 ? (
        <p className="text-kov-steel text-sm">Aucune collection. Commencez par en créer une, puis rangez-y des prompts depuis leur menu.</p>
      ) : (
        <ul className="space-y-1">
          {(collections ?? []).map((collection) => (
            <li
              key={collection.id}
              className="flex items-center gap-3 border px-3 py-2"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-kov-bone text-sm truncate">{collection.name}</p>
                {collection.description && <p className="text-kov-steel text-xs truncate">{collection.description}</p>}
              </div>
              <span className="text-kov-steel text-xs tabular-nums">{collection.count}</span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Supprimer « ${collection.name} » ? Les prompts qu'elle contient ne sont pas supprimés.`)) {
                    remove.mutate(collection.id);
                  }
                }}
                className="text-kov-steel hover:text-kov-red transition-colors"
                aria-label={`Supprimer ${collection.name}`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function CollectionsManager() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CategoriesPanel />
      <CollectionsPanel />
    </div>
  );
}
