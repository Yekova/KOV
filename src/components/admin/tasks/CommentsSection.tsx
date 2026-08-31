"use client";

import { useState, useTransition } from "react";
import { addComment, deleteComment } from "@/app/admin/tasks/actions";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

type Comment = { id: string; body: string; authorId: string; authorName: string; createdAt: string; editedAt: string | null };

export function CommentsSection({
  taskId,
  comments,
  onChange,
}: {
  taskId: string;
  comments: Comment[];
  onChange: () => void;
}) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const value = body.trim();
    if (!value) return;
    setBody("");
    setError(null);
    startTransition(async () => {
      try {
        await addComment(taskId, value);
        onChange();
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'ajout a échoué.");
      }
    });
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-3">Commentaires</p>

      {comments.length > 0 && (
        <ul className="space-y-3 mb-4">
          {comments.map((comment) => (
            <li key={comment.id} className="group">
              <div className="flex items-center justify-between gap-2">
                <p className="text-kov-bone text-xs">
                  {comment.authorName} <span className="text-kov-steel">— {formatRelativeTime(comment.createdAt)}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        await deleteComment(comment.id);
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
              </div>
              <p className="text-kov-bone text-sm mt-1 whitespace-pre-wrap">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-kov-red text-xs mb-2">{error}</p>}

      <div className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Écrire un commentaire…"
          rows={2}
          disabled={isPending}
          className="w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--kov-border)" }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !body.trim()}
          className="text-kov-red text-xs uppercase tracking-widest disabled:opacity-40"
        >
          Publier
        </button>
      </div>
    </div>
  );
}
