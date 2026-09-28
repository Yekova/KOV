import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getRequestThreads } from "@/lib/admin/requests";
import { KovEmptyState } from "@/components/ui/KovStates";

export const metadata: Metadata = { title: "Demandes — Admin KOV" };

// La colonne centrale quand aucun fil n'est ouvert.
//
// Elle ne répète pas la liste — celle-ci est à gauche. Elle dit ce qui
// attend, et depuis combien de temps : c'est la seule information que la
// liste ne porte pas, parce qu'elle est un total et non une ligne.
export default async function AdminRequestsPage() {
  await requireAdmin();
  const threads = await getRequestThreads();

  const waiting = threads.filter((thread) => thread.waitingOn === "us");
  const oldest = waiting.reduce<number | null>(
    (max, thread) =>
      thread.waitingDays === null ? max : max === null ? thread.waitingDays : Math.max(max, thread.waitingDays),
    null
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14 md:px-10">
      {threads.length === 0 ? (
        <KovEmptyState
          title="Aucune demande pour l'instant"
          description="Les messages écrits par vos clients depuis leur espace arrivent ici, et la conversation se tient au même endroit."
        />
      ) : waiting.length === 0 ? (
        <KovEmptyState
          title="Rien à traiter"
          description="Toutes les conversations attendent une réponse du client, ou sont clôturées. Choisissez-en une à gauche pour la relire."
        />
      ) : (
        <div>
          <h2 className="font-display text-xl uppercase text-kov-bone">
            {waiting.length} demande{waiting.length > 1 ? "s" : ""} attend{waiting.length > 1 ? "ent" : ""} votre
            réponse<span className="text-kov-red">.</span>
          </h2>
          {oldest !== null && oldest > 0 && (
            <p className="mt-3 text-sm text-kov-concrete">
              La plus ancienne attend depuis {oldest} jour{oldest > 1 ? "s" : ""}.
            </p>
          )}
          <p className="mt-6 text-sm text-kov-concrete">
            Choisissez une conversation à gauche pour y répondre. Le filtre « À traiter » est actif par défaut.
          </p>
        </div>
      )}
    </main>
  );
}
