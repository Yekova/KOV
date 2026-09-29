"use client";

import { useRef } from "react";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { EmojiPicker } from "@/components/requests/EmojiPicker";
import { AttachmentField, ReplyQuoteBanner } from "@/components/requests/ComposerExtras";
import { useThreadInteraction } from "@/components/requests/ThreadInteraction";
import { useKovAction } from "@/lib/useKovAction";
import { replyToOwnThread } from "../actions";

export function ReplyForm({ threadId }: { threadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { clearReplyTo } = useThreadInteraction();
  const action = useKovAction({ success: "Message envoyé.", fallbackError: "L'envoi a échoué." });

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        action.run(async () => {
          // L'action RENVOIE son erreur (voir le #441 : une exception qui
          // traverse une action serveur perd son message). Il faut la
          // relever ici pour que le cycle passe en « erreur ».
          const result = await replyToOwnThread(threadId, formData);
          if (result.error) throw new Error(result.error);
          formRef.current?.reset();
          // La citation ne survit pas à l'envoi : elle visait CE message,
          // pas la conversation.
          clearReplyTo();
        });
      }}
      className="space-y-3"
    >
      <ReplyQuoteBanner />

      <textarea
        ref={bodyRef}
        name="body"
        required
        rows={3}
        placeholder="Votre message…"
        className="kov-field w-full border bg-transparent p-3 text-sm text-kov-bone placeholder:text-kov-concrete/70 focus:outline-none"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <KovActionButton state={action.state} onStateSettled={action.reset}>
          Envoyer
        </KovActionButton>
        <EmojiPicker targetRef={bodyRef} />
        <AttachmentField />
        {action.error && (
          <p role="alert" className="text-sm" style={{ color: "var(--kov-red)" }}>
            {action.error}
          </p>
        )}
      </div>
    </form>
  );
}
