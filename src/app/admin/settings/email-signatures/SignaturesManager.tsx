"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Star, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmailBodyEditor } from "@/components/email/EmailBodyEditor";
import { createSignature, updateSignature, deleteSignature, setDefaultSignature, type SignatureRow } from "./actions";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

function SignatureCard({ signature }: { signature: SignatureRow }) {
  const [name, setName] = useState(signature.name);
  const [content, setContent] = useState(signature.content);
  const [isPending, startTransition] = useTransition();
  const dirty = name !== signature.name || content !== signature.content;

  function handleSave() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("content", content);
      const result = await updateSignature(signature.id, formData);
      if (result.error) toast.error(result.error);
      else toast.success("Signature mise à jour");
    });
  }

  function handleDelete() {
    if (!window.confirm("Supprimer cette signature ?")) return;
    startTransition(async () => {
      const result = await deleteSignature(signature.id);
      if (result.error) toast.error(result.error);
    });
  }

  function handleSetDefault() {
    startTransition(async () => {
      const result = await setDefaultSignature(signature.id);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="p-4 space-y-3" style={{ background: "var(--kov-carbon)", border: "1px solid var(--kov-border)", borderRadius: "var(--radius-md)" }}>
      <div className="flex items-center gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} className={`${FIELD_CLASS} flex-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
        <button
          type="button"
          onClick={handleSetDefault}
          disabled={signature.isDefault || isPending}
          title={signature.isDefault ? "Signature par défaut" : "Définir par défaut"}
          className="shrink-0 disabled:opacity-100"
        >
          <Star size={16} fill={signature.isDefault ? "var(--kov-red)" : "none"} color={signature.isDefault ? "var(--kov-red)" : "var(--kov-steel)"} />
        </button>
        <button type="button" onClick={handleDelete} disabled={isPending} className="text-kov-steel hover:text-kov-red transition-colors shrink-0">
          <Trash2 size={15} />
        </button>
      </div>

      <div style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
        <EmailBodyEditor value={content} onChange={setContent} />
      </div>

      {dirty && (
        <Button type="button" variant="secondary" disabled={isPending} onClick={handleSave}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      )}
    </div>
  );
}

export function SignaturesManager({ signatures }: { signatures: SignatureRow[] }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    const formData = new FormData();
    formData.set("name", newName);
    formData.set("content", newContent);
    startTransition(async () => {
      const result = await createSignature(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Signature créée");
      setCreating(false);
      setNewName("");
      setNewContent("");
    });
  }

  return (
    <div className="space-y-4">
      {signatures.map((s) => (
        <SignatureCard key={s.id} signature={s} />
      ))}

      {creating ? (
        <div className="p-4 space-y-3" style={{ border: "1px dashed var(--kov-border)", borderRadius: "var(--radius-md)" }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom de la signature (ex. « KOV — standard »)"
            className={FIELD_CLASS}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
          <div style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
            <EmailBodyEditor value={newContent} onChange={setNewContent} placeholder="Matteo Delorme&#10;KOV Studio&#10;www.kov-agency.site" />
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => setCreating(false)}>
              Annuler
            </Button>
            <Button type="button" variant="primary" disabled={isPending || !newName.trim()} onClick={handleCreate}>
              Créer
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="secondary" onClick={() => setCreating(true)}>
          <Plus size={14} /> Nouvelle signature
        </Button>
      )}
    </div>
  );
}
