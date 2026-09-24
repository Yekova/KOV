"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Copy, Loader2, Plus, Trash2, X } from "lucide-react";
import { extractVariableKeys } from "@/lib/prompts/template";
import { createPrompt } from "./actions";
import { createPromptBlock, deletePromptBlock, getPromptBlocks, type PromptBlockRow } from "./library-actions";
import { EMPTY_PROMPT } from "./schema";

const FIELD =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";
const FIELD_STYLE = { borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" } as const;
const LABEL = "text-[11px] uppercase tracking-widest text-kov-steel";

// Le Builder assemble des blocs en un prompt neuf.
//
// Volontairement une pile ordonnée et non un éditeur de nœuds : ce qu'on
// compose est un texte, et un texte a un ordre. Une toile de boîtes reliées
// par des fils n'ajouterait rien qu'une liste ne dise déjà, et coûterait
// une bibliothèque de graphe pour le dire.
//
// Le même bloc peut être empilé deux fois — d'où une clé d'instance plutôt
// que l'identifiant du bloc.

interface Slot {
  instanceId: string;
  block: PromptBlockRow;
}

function NewBlockForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createPromptBlock({ name, description: "", content, category, status: "active" }),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      queryClient.invalidateQueries({ queryKey: ["prompt-blocks"] });
      toast.success("Bloc créé");
      onDone();
    },
    onError: () => toast.error("La création du bloc a échoué."),
  });

  return (
    <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--kov-border)" }}>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nom du bloc"
        className={FIELD}
        style={FIELD_STYLE}
      />
      <input
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        placeholder="Famille (Méthode, Design…)"
        className={FIELD}
        style={FIELD_STYLE}
      />
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={5}
        placeholder="Contenu du bloc"
        className={`${FIELD} font-mono text-xs`}
        style={FIELD_STYLE}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => create.mutate()}
          disabled={create.isPending || !name.trim() || !content.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-widest text-kov-white transition-colors disabled:opacity-40"
          style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
        >
          {create.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Créer
        </button>
        <button type="button" onClick={onDone} className="text-kov-steel hover:text-kov-bone text-[11px] uppercase tracking-widest transition-colors">
          Annuler
        </button>
      </div>
    </div>
  );
}

export function PromptBuilder() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: blocks, isLoading } = useQuery({ queryKey: ["prompt-blocks"], queryFn: getPromptBlocks });

  const [slots, setSlots] = useState<Slot[]>([]);
  const [title, setTitle] = useState("");
  const [creatingBlock, setCreatingBlock] = useState(false);
  const [copied, setCopied] = useState(false);

  const assembled = useMemo(() => slots.map((slot) => slot.block.content.trim()).join("\n\n"), [slots]);
  const detectedKeys = useMemo(() => extractVariableKeys(assembled), [assembled]);

  const removeBlock = useMutation({
    mutationFn: (id: string) => deletePromptBlock(id),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      queryClient.invalidateQueries({ queryKey: ["prompt-blocks"] });
      toast.success("Bloc supprimé");
    },
  });

  const save = useMutation({
    mutationFn: () =>
      createPrompt({
        ...EMPTY_PROMPT,
        title,
        content: assembled,
        status: "draft",
        changeNote: "Assemblé dans le Builder",
        // Les variables présentes dans les blocs sont déclarées d'office :
        // sans ça, le prompt naîtrait avec des {{cle}} que le formulaire
        // d'utilisation ne demanderait jamais.
        variables: detectedKeys.map((key) => ({
          key,
          label: "",
          type: "text" as const,
          defaultValue: "",
          placeholder: "",
          description: "",
          options: [],
          required: false,
        })),
      }),
    onSuccess: (result) => {
      if (result.error) return toast.error(result.error);
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Prompt créé en brouillon");
      if (result.id) router.push(`/admin/prompts/${result.id}`);
    },
    onError: () => toast.error("L'enregistrement a échoué."),
  });

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slots.length) return;
    const next = [...slots];
    [next[index], next[target]] = [next[target], next[index]];
    setSlots(next);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(assembled);
      setCopied(true);
      toast.success("Prompt copié");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("La copie a échoué.");
    }
  }

  const byCategory = useMemo(() => {
    const groups = new Map<string, PromptBlockRow[]>();
    for (const block of blocks ?? []) {
      const key = block.category || "Autres";
      groups.set(key, [...(groups.get(key) ?? []), block]);
    }
    return Array.from(groups.entries());
  }, [blocks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_24rem] gap-6">
      {/* Blocs disponibles */}
      <section
        className="border p-4 space-y-4 self-start"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-kov-bone text-sm uppercase tracking-widest">Blocs</h2>
          <button
            type="button"
            onClick={() => setCreatingBlock((current) => !current)}
            className="text-kov-steel hover:text-kov-bone transition-colors"
            aria-label="Créer un bloc"
          >
            {creatingBlock ? <X size={15} /> : <Plus size={15} />}
          </button>
        </div>

        {isLoading ? (
          <p className="text-kov-steel text-sm">Chargement…</p>
        ) : byCategory.length === 0 ? (
          <p className="text-kov-steel text-sm">
            Aucun bloc. Créez-en un, ou installez la base de départ depuis la bibliothèque.
          </p>
        ) : (
          byCategory.map(([category, items]) => (
            <div key={category}>
              <p className="text-[10px] uppercase tracking-widest text-kov-steel mb-1.5">{category}</p>
              <ul className="space-y-1">
                {items.map((block) => (
                  <li key={block.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setSlots((current) => [
                          ...current,
                          { instanceId: `${block.id}-${current.length}-${Date.now()}`, block },
                        ])
                      }
                      className="flex-1 text-left px-2.5 py-1.5 text-xs text-kov-concrete border transition-colors hover:border-kov-red hover:text-kov-bone"
                      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                      title={block.description}
                    >
                      {block.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Supprimer le bloc « ${block.name} » ?`)) removeBlock.mutate(block.id);
                      }}
                      className="text-kov-steel hover:text-kov-red transition-colors p-1"
                      aria-label={`Supprimer le bloc ${block.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}

        {creatingBlock && <NewBlockForm onDone={() => setCreatingBlock(false)} />}
      </section>

      {/* Ordre des blocs */}
      <section className="space-y-3">
        <h2 className="font-display text-kov-bone text-sm uppercase tracking-widest">Composition</h2>

        {slots.length === 0 ? (
          <div
            className="border border-dashed p-10 text-center"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            <p className="text-kov-bone text-sm">Rien d&apos;empilé.</p>
            <p className="text-kov-steel text-sm mt-2">Choisissez des blocs à gauche : ils s&apos;ajoutent dans l&apos;ordre.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {slots.map((slot, index) => (
              <li
                key={slot.instanceId}
                className="border p-3"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-kov-steel text-xs tabular-nums w-5">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex-1 text-kov-bone text-sm truncate">{slot.block.name}</span>
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="text-kov-steel hover:text-kov-bone transition-colors disabled:opacity-25"
                    aria-label={`Monter ${slot.block.name}`}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === slots.length - 1}
                    className="text-kov-steel hover:text-kov-bone transition-colors disabled:opacity-25"
                    aria-label={`Descendre ${slot.block.name}`}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlots((current) => current.filter((item) => item.instanceId !== slot.instanceId))}
                    className="text-kov-steel hover:text-kov-red transition-colors"
                    aria-label={`Retirer ${slot.block.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {slots.length > 0 && (
          <div
            className="border p-4 space-y-3"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            <div>
              <label className={LABEL}>Enregistrer comme prompt</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Nom du prompt"
                className={`${FIELD} mt-1`}
                style={FIELD_STYLE}
              />
            </div>
            {detectedKeys.length > 0 && (
              <p className="text-kov-steel text-xs">
                {detectedKeys.length} variable{detectedKeys.length > 1 ? "s" : ""} détectée
                {detectedKeys.length > 1 ? "s" : ""} dans les blocs, déclarée
                {detectedKeys.length > 1 ? "s" : ""} automatiquement :{" "}
                <span className="font-mono text-kov-concrete">{detectedKeys.join(", ")}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => save.mutate()}
                disabled={save.isPending || !title.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-widest text-kov-white transition-colors disabled:opacity-40"
                style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
              >
                {save.isPending && <Loader2 size={13} className="animate-spin" />}
                Enregistrer
              </button>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-2 border px-4 py-2.5 text-[11px] uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copié" : "Copier"}
              </button>
              <button
                type="button"
                onClick={() => setSlots([])}
                className="text-kov-steel hover:text-kov-bone text-[11px] uppercase tracking-widest transition-colors"
              >
                Vider
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Aperçu */}
      <section className="hidden xl:block">
        <h2 className="font-display text-kov-bone text-sm uppercase tracking-widest mb-3">Prompt final</h2>
        <pre
          className="border overflow-auto text-[11px] leading-relaxed whitespace-pre-wrap"
          style={{
            borderColor: "var(--kov-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--kov-carbon)",
            color: "var(--kov-concrete)",
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            padding: "12px 14px",
            maxHeight: "calc(100vh - 14rem)",
          }}
        >
          {assembled || "—"}
        </pre>
      </section>
    </div>
  );
}
