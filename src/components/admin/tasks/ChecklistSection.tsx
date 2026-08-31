"use client";

import { useState, useTransition } from "react";
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem } from "@/app/admin/tasks/actions";

type ChecklistItem = { id: string; label: string; isDone: boolean; position: number };

export function ChecklistSection({
  taskId,
  items,
  onChange,
}: {
  taskId: string;
  items: ChecklistItem[];
  onChange: () => void;
}) {
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const done = items.filter((i) => i.isDone).length;

  function handleAdd() {
    const value = label.trim();
    if (!value) return;
    setLabel("");
    setError(null);
    startTransition(async () => {
      try {
        await addChecklistItem(taskId, value);
        onChange();
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'ajout a échoué.");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-kov-steel">Checklist</p>
        {items.length > 0 && (
          <span className="text-kov-steel text-xs">
            {done}/{items.length}
          </span>
        )}
      </div>

      {items.length > 0 && (
        <ul className="space-y-2 mb-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 group">
              <input
                type="checkbox"
                checked={item.isDone}
                onChange={(e) => {
                  startTransition(async () => {
                    try {
                      await toggleChecklistItem(item.id, e.target.checked);
                      onChange();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "La mise à jour a échoué.");
                    }
                  });
                }}
                className="accent-kov-red"
              />
              <span className={`text-sm flex-1 ${item.isDone ? "text-kov-steel line-through" : "text-kov-bone"}`}>
                {item.label}
              </span>
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await deleteChecklistItem(item.id);
                      onChange();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "La suppression a échoué.");
                    }
                  });
                }}
                className="text-kov-steel hover:text-kov-red text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Supprimer"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-kov-red text-xs mb-2">{error}</p>}

      <div className="flex items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Ajouter un élément…"
          disabled={isPending}
          className="flex-1 bg-transparent border px-3 py-1.5 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--kov-border)" }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !label.trim()}
          className="text-kov-red text-xs uppercase tracking-widest disabled:opacity-40"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
