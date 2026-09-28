import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { ClientAvatar } from "@/components/admin/clients/ClientAvatar";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { getRequestThread } from "@/lib/admin/requests";
import { RequestReplyForm } from "./RequestReplyForm";
import { ThreadStatusActions } from "./ThreadStatusActions";

export const metadata: Metadata = { title: "Demande — Admin KOV" };

const STATUS_LABELS: Record<string, string> = {
  open: "Ouverte",
  answered: "Répondue",
  closed: "Clôturée",
};

export default async function AdminRequestThreadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const thread = await getRequestThread(id);
  if (!thread) notFound();

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <Link
          href="/admin/requests"
          className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors"
        >
          ← Demandes
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4 mt-4">
          <div className="min-w-0">
            <h1 className="font-display text-kov-bone text-2xl uppercase">{thread.subject}</h1>
            <p className="text-kov-steel text-sm mt-1">
              {STATUS_LABELS[thread.status] ?? thread.status}
              {" · "}
              <Link href={`/admin/clients/${thread.clientId}`} className="hover:text-kov-red transition-colors">
                {thread.clientName}
              </Link>
              {thread.projectId && (
                <>
                  {" · "}
                  <Link href={`/admin/projects/${thread.projectId}`} className="hover:text-kov-red transition-colors">
                    {thread.projectName}
                  </Link>
                </>
              )}
              {" · ouverte "}
              {formatRelativeTime(thread.createdAt)}
            </p>
          </div>

          <ThreadStatusActions threadId={thread.id} status={thread.status} />
        </div>

        {thread.waitingOn === "us" && (
          <p className="text-sm mt-3" style={{ color: "var(--kov-red)" }}>
            En attente de votre réponse
            {thread.waitingDays !== null && thread.waitingDays > 0 && ` depuis ${thread.waitingDays} jour${thread.waitingDays > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      <GlassCard className="p-6">
        <ul className="space-y-5">
          {thread.messages.map((message) => {
            const fromUs = message.createdBy === "admin";
            return (
              <li key={message.id} className="flex gap-3">
                <ClientAvatar
                  name={message.authorName ?? (fromUs ? "KOV" : thread.clientName)}
                  avatarUrl={fromUs ? null : thread.clientAvatarUrl}
                  size={32}
                />
                <div
                  className="min-w-0 flex-1 px-4 py-3"
                  style={{
                    // Le côté d'où vient le message est porté par la teinte
                    // du fond ET par le nom de l'auteur, jamais par la seule
                    // position : un fil qu'on ne peut lire qu'en regardant
                    // de quel côté penche la bulle est illisible en liste.
                    background: fromUs ? "var(--kov-graphite)" : "var(--kov-carbon)",
                    border: "1px solid var(--kov-border)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <p className="text-[11px] text-kov-steel">
                    <span className="text-kov-concrete">
                      {fromUs ? (message.authorName ?? "Équipe KOV") : thread.clientName}
                    </span>
                    {" · "}
                    {formatRelativeTime(message.createdAt)}
                  </p>
                  {/* Texte brut rendu tel quel, retours à la ligne préservés.
                      Le corps vient d'un client : aucun HTML n'est
                      interprété, jamais. */}
                  <p className="text-kov-bone text-sm mt-1.5 whitespace-pre-wrap break-words">{message.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </GlassCard>

      {thread.status === "closed" ? (
        <GlassCard className="p-5">
          <p className="text-kov-steel text-sm">
            Cette demande est clôturée. Rouvrez-la pour répondre, ou laissez le client la relancer : son message
            la rouvrira automatiquement.
          </p>
        </GlassCard>
      ) : (
        <RequestReplyForm threadId={thread.id} />
      )}
    </main>
  );
}
