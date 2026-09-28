import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getRequestThreads } from "@/lib/admin/requests";
import { RequestsTable } from "@/components/admin/requests/RequestsTable";

export const metadata: Metadata = { title: "Demandes — Admin KOV" };

export default async function AdminRequestsPage() {
  await requireAdmin();
  const threads = await getRequestThreads();

  const waiting = threads.filter((thread) => thread.waitingOn === "us");
  const oldest = waiting.reduce<number | null>(
    (max, thread) => (thread.waitingDays === null ? max : max === null ? thread.waitingDays : Math.max(max, thread.waitingDays)),
    null
  );

  return (
    <main className="px-6 py-10 max-w-[1600px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Demandes</h1>
        <p className="text-kov-steel text-sm mt-2 max-w-xl">
          Ce que vos clients écrivent depuis leur espace, et qui attend une réponse.
        </p>

        {/* La seule phrase de l'en-tête, et elle ne s'affiche que s'il y a
            quelque chose à dire. Les onglets portent déjà les comptes ;
            l'ancienneté, elle, n'est visible nulle part ailleurs. */}
        {waiting.length > 0 && (
          <p className="text-sm mt-3" style={{ color: "var(--kov-red)" }}>
            {waiting.length} demande{waiting.length > 1 ? "s" : ""} attend
            {waiting.length > 1 ? "ent" : ""} une réponse
            {oldest !== null && oldest > 0 && ` · la plus ancienne depuis ${oldest} jour${oldest > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      <RequestsTable threads={threads} />
    </main>
  );
}
