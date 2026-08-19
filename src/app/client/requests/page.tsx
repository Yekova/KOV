import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { REQUEST_THREAD_STATUS_LABELS, type RequestThreadStatus } from "@/lib/portal/status";
import { createRequestThread } from "./actions";

export const metadata: Metadata = {
  title: "Demandes — KOV",
};

const FIELD_CLASS =
  "w-full bg-transparent border py-2.5 px-3 text-kov-bone placeholder:text-kov-steel text-sm focus:outline-none focus:border-kov-red transition-colors";

export default async function ClientRequestsPage() {
  const user = await requireUser();

  const { data: threads } = await supabaseAdmin
    .from("request_threads")
    .select("id, subject, status, updated_at")
    .eq("client_id", user.id)
    .order("updated_at", { ascending: false });

  const rows = threads ?? [];

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full space-y-8">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Demandes</h1>

      <GlassCard className="p-6">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Nouvelle demande</p>
        <form action={createRequestThread} className="space-y-4">
          <input
            type="text"
            name="subject"
            required
            placeholder="Sujet"
            className={FIELD_CLASS}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Votre message…"
            className={FIELD_CLASS}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
          <Button type="submit" variant="primary">
            Envoyer
          </Button>
        </form>
      </GlassCard>

      <GlassCard className="p-6">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Vos demandes</p>
        {rows.length === 0 ? (
          <p className="text-kov-steel text-sm">Aucune demande pour l&apos;instant.</p>
        ) : (
          <ul>
            {rows.map((thread) => (
              <li
                key={thread.id}
                className="flex items-center justify-between gap-4 py-4 border-b last:border-b-0"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <div>
                  <p className="text-kov-bone text-sm">{thread.subject}</p>
                  <p className="text-kov-steel text-xs mt-1">
                    {new Date(thread.updated_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="text-kov-red text-xs uppercase tracking-widest shrink-0">
                  {REQUEST_THREAD_STATUS_LABELS[thread.status as RequestThreadStatus] ?? thread.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </main>
  );
}
