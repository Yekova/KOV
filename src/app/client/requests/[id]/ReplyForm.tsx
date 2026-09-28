"use client";

import { useRef } from "react";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { useKovAction } from "@/lib/useKovAction";
import { replyToOwnThread } from "../actions";

export function ReplyForm({ threadId }: { threadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = useKovAction({ success: "Message envoyé.", fallbackError: "L'envoi a échoué." });

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        action.run(async () => {
          await replyToOwnThread(threadId, formData);
          formRef.current?.reset();
        });
      }}
      className="space-y-3"
    >
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Votre message…"
        className="kov-field w-full border bg-transparent p-3 text-sm text-kov-bone placeholder:text-kov-concrete/70 focus:outline-none"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
      />
      <div className="flex flex-wrap items-center gap-4">
        <KovActionButton state={action.state} onStateSettled={action.reset}>
          Envoyer
        </KovActionButton>
        {action.error && (
          <p role="alert" className="text-sm" style={{ color: "var(--kov-red)" }}>
            {action.error}
          </p>
        )}
      </div>
    </form>
  );
}
