import { requireAdmin } from "@/lib/auth";
import { getRequestThreads } from "@/lib/admin/requests";
import { ConversationList, type ConversationItem } from "@/components/requests/ConversationList";

// La messagerie du studio, sur le même plan que celle du client.
//
// C'était un tableau de gestion : une ligne par demande, sept colonnes, et
// il fallait changer de page pour lire un fil. Utile pour trier, mauvais
// pour répondre — or répondre est ce qu'on fait ici quatre-vingt-dix pour
// cent du temps.
//
// Les deux côtés partagent le même composant de liste. Ils ne diffèrent
// que par ce que porte chaque ligne : le studio voit le nom du CLIENT en
// premier, puisque c'est ce qui distingue ses conversations ; le client
// voit le sujet, puisque toutes les siennes ont le même interlocuteur.
export default async function AdminRequestsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [threads, trashed] = await Promise.all([getRequestThreads(), getRequestThreads({ trashed: true })]);

  const items: ConversationItem[] = threads.map((thread) => ({
    id: thread.id,
    href: `/admin/requests/${thread.id}`,
    title: thread.clientName,
    subtitle: thread.subject,
    excerpt: thread.lastMessageExcerpt
      ? `${thread.lastMessageBy === "admin" ? "Vous : " : ""}${thread.lastMessageExcerpt}`
      : null,
    avatarUrl: thread.clientAvatarUrl,
    // Le studio voit qui est dans son espace en ce moment : la présence du
    // client est tenue automatiquement par le portail (PresenceHeartbeat).
    isOnline: thread.clientIsOnline,
    at: thread.lastMessageAt ?? thread.updatedAt,
    waitingLabel:
      thread.waitingOn === "us" ? "À traiter" : thread.waitingOn === "client" ? "Chez le client" : "Clôturée",
    waitingColor:
      thread.waitingOn === "us"
        ? "var(--kov-red)"
        : thread.waitingOn === "client"
          ? "var(--kov-status-orange)"
          : "var(--kov-steel)",
    needsYou: thread.waitingOn === "us",
    messageCount: thread.messageCount,
  }));

  return (
    <div className="kov-messaging">
      <aside
        className="kov-messaging__list shrink-0 border-b lg:border-b-0 lg:border-r"
        style={{ borderColor: "var(--kov-border)", background: "var(--kov-carbon)" }}
      >
        <ConversationList
          items={items}
          title="Demandes"
          trash={{ href: "/admin/requests/corbeille", count: trashed.length }}
        />
      </aside>

      {children}
    </div>
  );
}
