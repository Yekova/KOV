import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getMyRequestThread, getThreadContext } from "@/lib/portal/requests";
import { REQUEST_WAITING_COLORS, REQUEST_WAITING_LABELS } from "@/lib/portal/status";
import { MessageThread } from "@/components/requests/MessageThread";
import { ThreadInteractionProvider } from "@/components/requests/ThreadInteraction";
import { ThreadRail } from "@/components/requests/ThreadRail";
import { ThreadTrashButton } from "@/components/requests/ThreadTrashButton";
import { deleteMyMessage, reactToMessage, restoreMyMessage, trashMyThread } from "../actions";
import { ReplyForm } from "./ReplyForm";

export async function generateMetadata(props: PageProps<"/client/requests/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const { data } = await supabaseAdmin.from("request_threads").select("subject").eq("id", id).maybeSingle();
  return { title: data?.subject ? `${data.subject} — KOV` : "Message — KOV" };
}

// La conversation : le fil au centre, son contexte à droite.
//
// La colonne de gauche n'est pas ici — elle est dans le layout, et c'est
// ce qui permet de passer d'un fil à l'autre sans la recharger.
export default async function ClientRequestThreadPage(props: PageProps<"/client/requests/[id]">) {
  const user = await requireUser();
  const { id: threadId } = await props.params;

  const thread = await getMyRequestThread(user.id, threadId);
  if (!thread) notFound();

  const context = await getThreadContext(threadId, user.id, thread.summary.projectId);

  // Les actions sont liées au fil ici, côté serveur, et passées au
  // composant. C'est ce qui permet au fil d'être le MÊME des deux côtés
  // alors que les chemins à revalider diffèrent.
  const actions = {
    react: reactToMessage.bind(null, threadId),
    remove: deleteMyMessage.bind(null, threadId),
    restore: restoreMyMessage.bind(null, threadId),
  };

  const waitingOn = thread.summary.waitingOn;
  const closed = thread.summary.status === "closed";

  return (
    <ThreadInteractionProvider>
      <div className="flex h-full min-h-0 flex-col xl:flex-row">
      {/* Le fil. Il défile seul, et seulement lui : l'en-tête reste visible
          au-dessus, le champ de réponse reste posé en dessous. Une
          conversation dont l'en-tête part au premier défilement oblige à
          remonter pour savoir de quoi on parle. */}
      <div className="kov-thread-canvas flex min-h-0 flex-1 flex-col">
        <header
          className="shrink-0 border-b px-6 py-4 md:px-8"
          style={{ borderColor: "var(--kov-border)", background: "var(--kov-carbon)" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] text-kov-bone">{thread.summary.subject}</h2>
              <p className="mt-0.5 text-xs text-kov-concrete">
                {thread.summary.messageCount} message{thread.summary.messageCount > 1 ? "s" : ""}
                {thread.summary.projectName && (
                  <>
                    {" · "}
                    <Link
                      href={`/client/projects/${thread.summary.projectId}`}
                      className="transition-colors hover:text-kov-red"
                    >
                      {thread.summary.projectName}
                    </Link>
                  </>
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span
                className="px-2.5 py-1 text-[10px] uppercase tracking-widest"
                style={{
                  color: REQUEST_WAITING_COLORS[waitingOn],
                  border: `1px solid ${REQUEST_WAITING_COLORS[waitingOn]}`,
                  borderRadius: "var(--radius-pill)",
                }}
              >
                {REQUEST_WAITING_LABELS[waitingOn]}
              </span>
              <ThreadTrashButton
                threadId={thread.summary.id}
                listHref="/client/requests"
                otherSide="Le studio"
                onTrash={trashMyThread}
              />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <MessageThread messages={thread.messages} actions={actions} />
        </div>

        <div
          className="shrink-0 border-t px-6 py-4 md:px-8"
          style={{ borderColor: "var(--kov-border)", background: "var(--kov-carbon)" }}
        >
          {closed ? (
            <p className="text-sm text-kov-concrete">
              Cette conversation est clôturée. Votre prochain message la rouvre automatiquement.
            </p>
          ) : null}
          <ReplyForm threadId={thread.summary.id} />
        </div>
      </div>

      <aside
        className="shrink-0 border-t p-5 xl:h-full xl:w-[320px] xl:overflow-y-auto xl:border-l xl:border-t-0"
        style={{ borderColor: "var(--kov-border)" }}
      >
        <ThreadRail
          context={context}
          projectHref={(projectId) => `/client/projects/${projectId}`}
          documentsHref="/client/documents"
        />
        </aside>
      </div>
    </ThreadInteractionProvider>
  );
}
