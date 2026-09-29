import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getRequestThreads } from "@/lib/admin/requests";
import { purgeExpiredTrash, TRASH_RETENTION_DAYS } from "@/lib/messaging/mutations";
import { TrashedThreads } from "@/components/requests/TrashedThreads";
import { restoreThreadAsAdmin } from "../actions";

export const metadata: Metadata = { title: "Supprimés récemment — Admin KOV" };

// Le pendant exact de la corbeille du portail. Ce qui est rangé ici ne
// quitte QUE la liste du studio : le client garde ses conversations.
export default async function AdminTrashPage() {
  await requireAdmin();
  await purgeExpiredTrash();

  const threads = await getRequestThreads({ trashed: true });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14 md:px-10">
      <TrashedThreads
        threads={threads.map((thread) => ({
          id: thread.id,
          subject: `${thread.clientName} — ${thread.subject}`,
          deletedAt: thread.deletedAt,
          messageCount: thread.messageCount,
        }))}
        retentionDays={TRASH_RETENTION_DAYS}
        otherSide="votre client"
        onRestore={restoreThreadAsAdmin}
      />
    </main>
  );
}
