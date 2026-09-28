import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getRequestThread } from "@/lib/admin/requests";
import { getThreadContext } from "@/lib/portal/requests";
import { MessageThread, type ThreadMessageView } from "@/components/requests/MessageThread";
import { ThreadRail } from "@/components/requests/ThreadRail";
import { RequestReplyForm } from "./RequestReplyForm";
import { ThreadStatusActions } from "./ThreadStatusActions";

export async function generateMetadata(props: PageProps<"/admin/requests/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const { data } = await supabaseAdmin.from("request_threads").select("subject").eq("id", id).maybeSingle();
  return { title: data?.subject ? `${data.subject} — Admin KOV` : "Demande — Admin KOV" };
}

const WAITING_COLORS: Record<string, string> = {
  us: "var(--kov-red)",
  client: "#F5A524",
  nobody: "var(--kov-steel)",
};

const WAITING_LABELS: Record<string, string> = {
  us: "À traiter",
  client: "Chez le client",
  nobody: "Clôturée",
};

export default async function AdminRequestThreadPage(props: PageProps<"/admin/requests/[id]">) {
  await requireAdmin();
  const { id } = await props.params;

  const thread = await getRequestThread(id);
  if (!thread) notFound();

  const context = await getThreadContext(id, thread.clientId, thread.projectId);

  const messages: ThreadMessageView[] = thread.messages.map((message) => ({
    id: message.id,
    body: message.body,
    createdAt: message.createdAt,
    authorName: message.authorName,
    authorAvatarUrl: message.authorAvatarUrl,
    // « Vous », côté studio, c'est l'admin. Le même composant de fil sert
    // aux deux côtés : c'est cette ligne, et elle seule, qui change de bord.
    mine: message.createdBy === "admin",
  }));

  return (
    <div className="flex h-full min-h-0 flex-col xl:flex-row">
      <div className="flex min-h-0 flex-1 flex-col">
        <header
          className="shrink-0 border-b px-6 py-4 md:px-8"
          style={{ borderColor: "var(--kov-border)", background: "var(--kov-carbon)" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] text-kov-bone">{thread.subject}</h2>
              <p className="mt-0.5 text-xs text-kov-concrete">
                <Link href={`/admin/clients/${thread.clientId}`} className="transition-colors hover:text-kov-red">
                  {thread.clientName}
                </Link>
                {" · "}
                {thread.messageCount} message{thread.messageCount > 1 ? "s" : ""}
                {thread.projectName && (
                  <>
                    {" · "}
                    <Link
                      href={`/admin/projects/${thread.projectId}`}
                      className="transition-colors hover:text-kov-red"
                    >
                      {thread.projectName}
                    </Link>
                  </>
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span
                className="px-2.5 py-1 text-[10px] uppercase tracking-widest"
                style={{
                  color: WAITING_COLORS[thread.waitingOn],
                  border: `1px solid ${WAITING_COLORS[thread.waitingOn]}`,
                  borderRadius: "var(--radius-pill)",
                }}
              >
                {WAITING_LABELS[thread.waitingOn]}
                {thread.waitingOn === "us" && thread.waitingDays !== null && thread.waitingDays > 0 && (
                  <> · {thread.waitingDays} j</>
                )}
              </span>
              <ThreadStatusActions threadId={thread.id} status={thread.status} />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <MessageThread messages={messages} />
        </div>

        <div
          className="shrink-0 border-t px-6 py-4 md:px-8"
          style={{ borderColor: "var(--kov-border)", background: "var(--kov-carbon)" }}
        >
          {thread.status === "closed" ? (
            <p className="text-sm text-kov-concrete">
              Cette demande est clôturée. Rouvrez-la pour répondre, ou laissez le client la relancer : son message la
              rouvre automatiquement.
            </p>
          ) : (
            <RequestReplyForm threadId={thread.id} />
          )}
        </div>
      </div>

      <aside
        className="shrink-0 border-t p-5 xl:h-full xl:w-[320px] xl:overflow-y-auto xl:border-l xl:border-t-0"
        style={{ borderColor: "var(--kov-border)" }}
      >
        <ThreadRail
          context={context}
          projectHref={(projectId) => `/admin/projects/${projectId}`}
          documentsHref={`/admin/clients/${thread.clientId}`}
        />
      </aside>
    </div>
  );
}
