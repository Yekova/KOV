"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { KovEmptyState } from "@/components/ui/KovStates";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

// « Supprimés récemment ».
//
// Un endroit, pas un filtre : une conversation supprimée n'est plus dans
// la liste, elle est ailleurs — et on en ressort. La mêler aux onglets
// aurait laissé croire qu'elle y était toujours, simplement masquée.
//
// ── CE QUE LA SUPPRESSION FAIT VRAIMENT, ÉCRIT À L'ÉCRAN ─────────────
//
// Elle est personnelle : l'autre côté garde la conversation entière. Le
// dire ici et pas seulement dans le code évite qu'on croie avoir effacé
// un échange chez son interlocuteur — dans une relation commerciale, la
// méprise coûterait cher.

export interface TrashedThread {
  id: string;
  subject: string;
  deletedAt: string | null;
  messageCount: number;
}

export function TrashedThreads({
  threads,
  retentionDays,
  otherSide,
  onRestore,
}: {
  threads: TrashedThread[];
  retentionDays: number;
  /** Qui garde encore la conversation : « le studio » ou « votre client ». */
  otherSide: string;
  onRestore: (threadId: string) => Promise<{ error?: string }>;
}) {
  const [pending, startTransition] = useTransition();

  if (threads.length === 0) {
    return (
      <KovEmptyState
        title="La corbeille est vide"
        description={`Les conversations que vous supprimez viennent ici et restent restaurables ${retentionDays} jours. Elles ne disparaissent que de votre liste — ${otherSide} les garde.`}
      />
    );
  }

  return (
    <div>
      <h2 className="font-display text-kov-bone text-xl uppercase">
        Supprimés récemment<span className="text-kov-red">.</span>
      </h2>
      <p className="text-kov-concrete mt-3 max-w-lg text-sm leading-relaxed">
        Restaurables {retentionDays} jours. Ces conversations ont seulement quitté votre liste — {otherSide} les garde
        entières.
      </p>

      <ul className="mt-8 space-y-2">
        {threads.map((thread) => (
          <li
            key={thread.id}
            className="flex flex-wrap items-center justify-between gap-4 border px-4 py-3"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
          >
            <div className="min-w-0">
              <p className="text-kov-bone truncate text-sm">{thread.subject}</p>
              <p className="text-kov-concrete mt-0.5 text-xs">
                {thread.messageCount} message{thread.messageCount > 1 ? "s" : ""}
                {thread.deletedAt && <> · supprimée {formatRelativeTime(thread.deletedAt)}</>}
              </p>
            </div>

            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await onRestore(thread.id);
                  if (result.error) toast.error(result.error);
                  else toast.success("Conversation restaurée.");
                })
              }
              className="text-kov-bone hover:border-kov-red hover:text-kov-red shrink-0 border px-3 py-2 text-xs tracking-widest uppercase transition-colors disabled:opacity-50"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
            >
              Restaurer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
