import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getMyRequestThreads } from "@/lib/portal/requests";
import { purgeExpiredTrash, TRASH_RETENTION_DAYS } from "@/lib/messaging/mutations";
import { TrashedThreads } from "@/components/requests/TrashedThreads";
import { restoreMyThread } from "../actions";

export const metadata: Metadata = { title: "Supprimés récemment — KOV" };

// La corbeille est une PAGE de la colonne centrale, pas un onglet de la
// liste : un layout Next ne reçoit pas les paramètres de recherche, et
// surtout une conversation supprimée n'est plus dans la liste — elle est
// ailleurs, et on en ressort.
export default async function ClientTrashPage() {
  const user = await requireUser();

  // Le ménage se fait à l'ouverture, faute d'ordonnanceur sur ce projet.
  // Annoncer une purge automatique qui n'existe pas serait pire.
  await purgeExpiredTrash();

  const threads = await getMyRequestThreads(user.id, { trashed: true });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14 md:px-10">
      <TrashedThreads
        threads={threads.map((thread) => ({
          id: thread.id,
          subject: thread.subject,
          deletedAt: thread.deletedAt,
          messageCount: thread.messageCount,
        }))}
        retentionDays={TRASH_RETENTION_DAYS}
        otherSide="le studio"
        onRestore={restoreMyThread}
      />
    </main>
  );
}
