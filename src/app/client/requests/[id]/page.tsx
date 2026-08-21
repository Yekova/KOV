import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { REQUEST_THREAD_STATUS_LABELS, type RequestThreadStatus } from "@/lib/portal/status";
import { ReplyForm } from "./ReplyForm";

export const metadata: Metadata = { title: "Demande — KOV" };

export default async function ClientRequestDetailPage(props: PageProps<"/client/requests/[id]">) {
  const user = await requireUser();
  const { id: threadId } = await props.params;

  const { data: thread } = await supabaseAdmin
    .from("request_threads")
    .select("id, subject, status, client_id, created_at")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread || thread.client_id !== user.id) notFound();

  const { data: messages } = await supabaseAdmin
    .from("request_messages")
    .select("id, body, created_by, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return (
    <main className="px-6 md:px-10 py-10 max-w-3xl mx-auto w-full space-y-8">
      <div>
        <Link href="/client/requests" className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors">
          ← Demandes
        </Link>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <h1 className="font-display text-kov-bone text-2xl uppercase">{thread.subject}</h1>
          <span className="text-kov-red text-xs uppercase tracking-widest">
            {REQUEST_THREAD_STATUS_LABELS[thread.status as RequestThreadStatus] ?? thread.status}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {(messages ?? []).map((message) => {
          const isClient = message.created_by === "client";
          return (
            <div key={message.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
              <GlassCard className={`p-4 max-w-[80%] ${isClient ? "" : ""}`} variant={isClient ? "glass" : "solid"}>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest mb-1.5">
                  {isClient ? "Vous" : "KOV"} — {new Date(message.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-kov-bone text-sm whitespace-pre-wrap">{message.body}</p>
              </GlassCard>
            </div>
          );
        })}
      </div>

      <GlassCard className="p-6">
        <ReplyForm threadId={thread.id} />
      </GlassCard>
    </main>
  );
}
