import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { REQUEST_THREAD_STATUS_LABELS, type RequestThreadStatus } from "@/lib/portal/status";
import { NewRequestForm } from "./NewRequestForm";

export const metadata: Metadata = {
  title: "Demandes — KOV",
};

export default async function ClientRequestsPage() {
  const user = await requireUser();

  const [{ data: threads }, { data: projects }] = await Promise.all([
    supabaseAdmin
      .from("request_threads")
      .select("id, subject, status, updated_at")
      .eq("client_id", user.id)
      .order("updated_at", { ascending: false }),
    supabaseAdmin.from("projects").select("id, name").eq("client_id", user.id),
  ]);

  const rows = threads ?? [];
  const projectRows = projects ?? [];

  const latestMessageByThread = new Map<string, { body: string; created_by: string }>();
  if (rows.length) {
    const { data: messages } = await supabaseAdmin
      .from("request_messages")
      .select("thread_id, body, created_by, created_at")
      .in(
        "thread_id",
        rows.map((t) => t.id)
      )
      .order("created_at", { ascending: false });
    for (const m of messages ?? []) {
      if (!latestMessageByThread.has(m.thread_id)) {
        latestMessageByThread.set(m.thread_id, { body: m.body, created_by: m.created_by });
      }
    }
  }

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full space-y-8">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Demandes</h1>

      <GlassCard className="p-6" variant="solid">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Nouvelle demande</p>
        <NewRequestForm projects={projectRows} />
      </GlassCard>

      <GlassCard className="p-6">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Vos demandes</p>
        {rows.length === 0 ? (
          <p className="text-kov-steel text-sm">Aucune demande pour l&apos;instant.</p>
        ) : (
          <ul>
            {rows.map((thread) => {
              const latest = latestMessageByThread.get(thread.id);
              return (
                <li key={thread.id} className="border-b last:border-b-0" style={{ borderColor: "var(--kov-border)" }}>
                  <Link href={`/client/requests/${thread.id}`} className="flex items-center justify-between gap-4 py-4 hover:bg-white/[0.02] transition-colors -mx-2 px-2">
                    <div className="min-w-0">
                      <p className="text-kov-bone text-sm">{thread.subject}</p>
                      {latest && (
                        <p className="text-kov-steel text-xs mt-1 truncate">
                          {latest.created_by === "client" ? "Vous : " : "KOV : "}
                          {latest.body}
                        </p>
                      )}
                      <p className="text-kov-steel text-xs mt-1">
                        {new Date(thread.updated_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className="text-kov-red text-xs uppercase tracking-widest shrink-0">
                      {REQUEST_THREAD_STATUS_LABELS[thread.status as RequestThreadStatus] ?? thread.status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </main>
  );
}
