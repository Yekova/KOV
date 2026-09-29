import { Portrait } from "@/components/ui/Portrait";

// Le fil, au centre.
//
// Deux choses le rendent lisible, et aucune n'est la position des bulles.
//
// D'abord chaque message porte le nom de son auteur et son portrait : un
// fil qu'on ne peut lire qu'en regardant de quel côté penche la bulle est
// illisible pour qui ne voit pas la mise en page, et illisible tout court
// quand trois personnes du studio écrivent.
//
// Ensuite les jours sont séparés. Sans séparateur, une conversation
// étalée sur trois semaines se lit comme une conversation d'un quart
// d'heure — et un client qui relit « on passe à l'intégration cette
// semaine » a besoin de savoir de quelle semaine on parle.

export interface ThreadMessageView {
  id: string;
  body: string;
  createdAt: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  /** Vrai quand c'est celui qui regarde qui a écrit. */
  mine: boolean;
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(iso) === dayKey(today.toISOString())) return "Aujourd'hui";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Hier";
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function MessageThread({ messages }: { messages: ThreadMessageView[] }) {
  if (messages.length === 0) {
    return <p className="py-10 text-sm text-kov-concrete">Aucun message dans cette conversation.</p>;
  }

  return (
    <ol className="space-y-5">
      {messages.map((message, index) => {
        // Comparé au message précédent plutôt qu'accumulé dans une variable
        // réassignée : le compilateur React refuse une écriture depuis un
        // rappel de rendu, parce qu'il ne peut pas savoir quand elle se
        // produit par rapport au rendu qu'il mémorise. Le calcul est
        // identique, il regarde juste en arrière au lieu de retenir.
        const showDay = index === 0 || dayKey(messages[index - 1].createdAt) !== dayKey(message.createdAt);

        return (
          <li key={message.id}>
            {showDay && (
              <div className="my-6 flex items-center gap-3 first:mt-0">
                <span aria-hidden="true" className="h-px flex-1" style={{ background: "var(--kov-border)" }} />
                <span className="text-[10px] uppercase tracking-widest text-kov-concrete">
                  {dayLabel(message.createdAt)}
                </span>
                <span aria-hidden="true" className="h-px flex-1" style={{ background: "var(--kov-border)" }} />
              </div>
            )}

            <div className={`flex gap-3 ${message.mine ? "flex-row-reverse" : ""}`}>
              <Portrait src={message.authorAvatarUrl} name={message.authorName} size={34} />

              <div className={`min-w-0 max-w-[min(42rem,85%)] ${message.mine ? "text-right" : ""}`}>
                <p className="text-[11px] text-kov-concrete">
                  <span className="text-kov-bone">{message.mine ? "Vous" : (message.authorName ?? "Équipe KOV")}</span>
                  {" · "}
                  {timeLabel(message.createdAt)}
                </p>

                {/* La teinte dit qui parle, en plus du nom et du côté.
                    Les deux fonds ne se distinguaient que d'un cran de gris,
                    ce qui ne se voit pas : l'écart est désormais franc, et
                    l'angle près de l'auteur est droit. Voir kov-surfaces.css. */}
                <div
                  className={`kov-bubble mt-1.5 inline-block px-4 py-3 text-left ${
                    message.mine ? "kov-bubble--mine" : "kov-bubble--theirs"
                  }`}
                >
                  {/* Texte brut, retours à la ligne préservés. Le corps vient
                      d'un humain : aucun HTML n'est interprété, jamais. */}
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-kov-bone">
                    {message.body}
                  </p>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
