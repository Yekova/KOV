"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { replyToOwnThread } from "../actions";

const FIELD_CLASS =
  "w-full bg-transparent border py-2.5 px-3 text-kov-bone placeholder:text-kov-steel text-sm focus:outline-none focus:border-kov-red transition-colors";

export function ReplyForm({ threadId }: { threadId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    startTransition(async () => {
      try {
        await replyToOwnThread(threadId, formData);
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'envoi a échoué.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Votre réponse…"
        className={FIELD_CLASS}
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      />
      {error && <p className="text-kov-red text-sm">{error}</p>}
      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Envoi…" : "Répondre"}
      </Button>
    </form>
  );
}
