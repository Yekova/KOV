import { requireUser } from "@/lib/auth";
import { getMyRequestThreads } from "@/lib/portal/requests";
import { REQUEST_WAITING_COLORS, REQUEST_WAITING_LABELS } from "@/lib/portal/status";
import { ConversationList, type ConversationItem } from "@/components/requests/ConversationList";

// La messagerie du client : trois colonnes, une seule page.
//
// La liste vit dans ce LAYOUT et non dans les pages. C'est ce qui fait la
// différence entre une messagerie et une suite de pages : ouvrir un fil ne
// redessine ni ne recharge la colonne de gauche, et Next ne réexécute pas
// ce fichier quand le paramètre de route change.
//
// Sous `lg`, les trois colonnes s'empilent et la liste passe au-dessus :
// sur un téléphone, une conversation occupe l'écran entier, et la liste
// est l'écran précédent.
export default async function ClientRequestsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [threads, trashed] = await Promise.all([
    getMyRequestThreads(user.id),
    getMyRequestThreads(user.id, { trashed: true }),
  ]);

  const items: ConversationItem[] = threads.map((thread) => ({
    id: thread.id,
    href: `/client/requests/${thread.id}`,
    // Côté client, la ligne principale est le SUJET : tous ses fils ont le
    // même interlocuteur, donc afficher « KOV » sur chaque ligne ne
    // distinguerait rien.
    title: thread.subject,
    subtitle: thread.projectName,
    excerpt: thread.lastMessageExcerpt
      ? `${thread.lastMessageBy === "client" ? "Vous : " : "KOV : "}${thread.lastMessageExcerpt}`
      : null,
    avatarUrl: null,
    at: thread.lastMessageAt ?? thread.updatedAt,
    waitingLabel: REQUEST_WAITING_LABELS[thread.waitingOn],
    waitingColor: REQUEST_WAITING_COLORS[thread.waitingOn],
    needsYou: thread.waitingOn === "you",
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
          title="Messages"
          newAction={{ label: "Nouvelle demande", href: "/client/requests" }}
          trash={{ href: "/client/requests/corbeille", count: trashed.length }}
        />
      </aside>

      {children}
    </div>
  );
}
