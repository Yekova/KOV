"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Portrait } from "@/components/ui/Portrait";
import { KOV_REACTIONS, type KovReaction } from "@/lib/messaging/reactions";
import { useThreadInteraction } from "@/components/requests/ThreadInteraction";
import type { MyThreadMessage } from "@/lib/portal/requests";

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
//
// ── LES ACTIONS ARRIVENT PAR LES PROPS ───────────────────────────────
//
// Réagir et supprimer n'écrivent pas au même endroit selon le côté : le
// portail revalide /client, le studio revalide les deux. Les deux pages
// passent donc leurs propres actions serveur, déjà liées à l'identifiant
// du fil. Le composant, lui, est le même — c'est ce qui garantit que les
// deux écrans montrent la même conversation.

export type ThreadMessageView = MyThreadMessage;

export interface ThreadActions {
  react: (messageId: string, emoji: string) => Promise<{ error?: string }>;
  remove: (messageId: string) => Promise<{ error?: string }>;
  restore: (messageId: string) => Promise<{ error?: string }>;
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

type Reaction = ThreadMessageView["reactions"][number];

// La réaction posée AVANT que le serveur réponde.
//
// Une réaction est un geste d'un dixième de seconde ; attendre l'aller-
// retour, la revalidation de la route et le nouveau rendu — souvent une
// demi-seconde — donne l'impression que le clic n'a pas pris. On applique
// donc le changement tout de suite, et React le remplace par la vérité du
// serveur quand elle arrive. Si l'écriture échoue, l'état revient seul et
// un toast dit pourquoi : rien n'est perdu, rien n'est inventé durablement.
//
// La liste est reclassée dans l'ordre de KOV_REACTIONS à chaque fois : une
// rangée dont les emoji changent de place au clic est impossible à viser
// deux fois de suite.
function applyReactionLocally(current: Reaction[], emoji: KovReaction): Reaction[] {
  const existing = current.find((reaction) => reaction.emoji === emoji);

  let next: Reaction[];
  if (existing?.mine) {
    next =
      existing.count <= 1
        ? current.filter((reaction) => reaction.emoji !== emoji)
        : current.map((reaction) =>
            reaction.emoji === emoji ? { ...reaction, count: reaction.count - 1, mine: false } : reaction
          );
  } else if (existing) {
    next = current.map((reaction) =>
      reaction.emoji === emoji ? { ...reaction, count: reaction.count + 1, mine: true } : reaction
    );
  } else {
    // `names` reste vide le temps de l'aller-retour : on ne connaît pas
    // son propre nom d'affichage ici, et l'inventer serait écrire une
    // donnée fausse dans une infobulle.
    next = [...current, { emoji, count: 1, mine: true, names: [] }];
  }

  return KOV_REACTIONS.map((value) => next.find((reaction) => reaction.emoji === value)).filter(
    (reaction): reaction is Reaction => Boolean(reaction)
  );
}

function sizeLabel(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function MessageThread({ messages, actions }: { messages: ThreadMessageView[]; actions?: ThreadActions }) {
  if (messages.length === 0) {
    return <p className="text-kov-concrete py-10 text-sm">Aucun message dans cette conversation.</p>;
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
                <span className="text-kov-concrete text-[10px] tracking-widest uppercase">
                  {dayLabel(message.createdAt)}
                </span>
                <span aria-hidden="true" className="h-px flex-1" style={{ background: "var(--kov-border)" }} />
              </div>
            )}
            <MessageRow message={message} actions={actions} />
          </li>
        );
      })}
    </ol>
  );
}

function MessageRow({ message, actions }: { message: ThreadMessageView; actions?: ThreadActions }) {
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { setReplyTo } = useThreadInteraction();
  const [reactions, addReaction] = useOptimistic(message.reactions, applyReactionLocally);

  function run(task: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await task();
      if (result.error) toast.error(result.error);
    });
  }

  // La réaction s'affiche AVANT l'envoi. Pas de `disabled` ici : un bouton
  // grisé le temps d'un aller-retour est exactement l'attente qu'on vient
  // de supprimer.
  function react(emoji: KovReaction) {
    if (!actions) return;
    startTransition(async () => {
      addReaction(emoji);
      const result = await actions.react(message.id, emoji);
      if (result.error) toast.error(result.error);
    });
  }

  // ── Le message supprimé : une trace, pas un trou ───────────────────
  //
  // Le corps n'arrive plus du serveur. Ce qui reste dit qu'il y a eu
  // quelque chose là — sans quoi une réponse peut se retrouver sans sa
  // question, et le fil change de sens en silence.
  if (message.deleted) {
    return (
      <div className={`flex gap-3 ${message.mine ? "flex-row-reverse" : ""}`}>
        <span className="w-[34px] shrink-0" aria-hidden="true" />
        <div className={`min-w-0 ${message.mine ? "text-right" : ""}`}>
          <p
            className="text-kov-concrete inline-block px-4 py-2.5 text-xs italic"
            style={{
              border: "1px dashed var(--kov-border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            Message supprimé
          </p>
          {message.canDelete && actions && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => actions.restore(message.id))}
              className="text-kov-concrete hover:text-kov-bone ml-3 text-[11px] underline-offset-4 transition-colors hover:underline"
            >
              Restaurer
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex gap-3 ${message.mine ? "flex-row-reverse" : ""}`}>
      <Portrait src={message.authorAvatarUrl} name={message.authorName} size={34} />

      <div className={`min-w-0 max-w-[min(42rem,85%)] ${message.mine ? "text-right" : ""}`}>
        <p className="text-kov-concrete text-[11px]">
          <span className="text-kov-bone">{message.mine ? "Vous" : (message.authorName ?? "Équipe KOV")}</span>
          {" · "}
          {timeLabel(message.createdAt)}
        </p>

        {/* La teinte dit qui parle : rouge pour nous, gris pour l'autre.
            Les couleurs sont dans kov-surfaces.css et non ici — c'est ce
            qui permet de traiter le texte, la citation et les pièces
            jointes différemment sur fond rouge sans dupliquer ce balisage
            (le bone n'atteint que 3,8:1 sur le rouge de marque ; le blanc
            monte à 4,7:1). */}
        <div
          className={`kov-bubble mt-1.5 inline-block px-4 py-3 text-left ${
            message.mine ? "kov-bubble--mine" : "kov-bubble--theirs"
          }`}
        >
          {message.replyTo && (
            // La citation porte un filet rouge et non un cadre : c'est un
            // rappel, pas un second message, et un cadre complet en ferait
            // deux bulles imbriquées.
            <p className="kov-bubble__quote mb-2 pl-2.5 text-[11px] leading-relaxed">
              <span className="kov-bubble__quote-author">{message.replyTo.authorName ?? "Message"}</span>
              <span> · {message.replyTo.excerpt}</span>
            </p>
          )}

          {/* Texte brut, retours à la ligne préservés. Le corps vient
              d'un humain : aucun HTML n'est interprété, jamais. */}
          {message.body && (
            <p className="kov-bubble__text text-sm leading-relaxed break-words whitespace-pre-wrap">{message.body}</p>
          )}

          {message.attachments.length > 0 && (
            <ul className={`space-y-1.5 ${message.body ? "mt-3" : ""}`}>
              {message.attachments.map((file) => (
                <li key={file.id}>
                  <a
                    href={file.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!file.url}
                    className="kov-bubble__file flex items-center gap-2.5 border px-3 py-2 text-xs transition-colors"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
                      <path
                        d="M21.4 11.05 12.25 20.2a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.67 3.67 0 0 1 5.18 5.18l-9.2 9.2a1.83 1.83 0 1 1-2.59-2.6l8.49-8.48"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="min-w-0 flex-1 truncate">{file.filename}</span>
                    {sizeLabel(file.sizeBytes) && (
                      <span className="kov-bubble__file-size shrink-0 tabular-nums">{sizeLabel(file.sizeBytes)}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Les réactions posées. Toujours sous la bulle, alignées du côté
            de l'auteur, pour qu'elles ne se confondent pas avec celles du
            message d'en face. */}
        {reactions.length > 0 && (
          <div className={`mt-1.5 flex flex-wrap gap-1 ${message.mine ? "justify-end" : ""}`}>
            {reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                disabled={!actions}
                onClick={() => react(reaction.emoji)}
                title={reaction.names.join(", ")}
                aria-pressed={reaction.mine}
                className="flex items-center gap-1 px-2 py-0.5 text-[12px] transition-colors"
                style={{
                  background: reaction.mine ? "rgba(227,30,36,0.14)" : "var(--kov-lift-2)",
                  border: `1px solid ${reaction.mine ? "rgba(227,30,36,0.45)" : "var(--kov-border)"}`,
                  borderRadius: "var(--radius-pill)",
                }}
              >
                <span aria-hidden="true">{reaction.emoji}</span>
                <span className="text-kov-concrete text-[11px] tabular-nums">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* La barre d'actions. Elle n'apparaît qu'au survol du message et
            au focus clavier : posée en permanence, elle doublerait le
            bruit visuel du fil. */}
        {actions && (
          <div
            className={`mt-1 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 ${
              message.mine ? "justify-end" : ""
            }`}
          >
            <div className="relative">
              <ActionButton
                label="Réagir"
                onClick={() => setPickerOpen((open) => !open)}
                expanded={pickerOpen}
                icon={
                  <>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                    <path
                      d="M8.5 14.2c.9 1.1 2.1 1.7 3.5 1.7s2.6-.6 3.5-1.7"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <circle cx="9.2" cy="9.8" r="1" fill="currentColor" />
                    <circle cx="14.8" cy="9.8" r="1" fill="currentColor" />
                  </>
                }
              />
              {pickerOpen && (
                <div
                  className="kov-enter absolute bottom-full z-20 mb-1 flex gap-0.5 p-1.5"
                  style={{
                    ...(message.mine ? { right: 0 } : { left: 0 }),
                    background: "var(--kov-graphite)",
                    border: "1px solid var(--kov-border)",
                    borderRadius: "var(--radius-pill)",
                    boxShadow: "0 18px 36px -20px rgba(0,0,0,0.9)",
                  }}
                >
                  {KOV_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={`Réagir avec ${emoji}`}
                      onClick={() => {
                        setPickerOpen(false);
                        react(emoji);
                      }}
                      className="flex h-7 w-7 items-center justify-center text-[15px] leading-none transition-colors hover:bg-white/10"
                      style={{ borderRadius: "999px" }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ActionButton
              label="Répondre"
              onClick={() =>
                setReplyTo({
                  id: message.id,
                  authorName: message.mine ? "Vous" : (message.authorName ?? "Équipe KOV"),
                  excerpt: (message.body || message.attachments[0]?.filename || "Pièce jointe")
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 120),
                })
              }
              icon={
                <path
                  d="M9 14 4 9l5-5M4 9h8.5A6.5 6.5 0 0 1 19 15.5V20"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              }
            />

            {message.canDelete && (
              <ActionButton
                label="Supprimer"
                onClick={() => {
                  if (!window.confirm("Supprimer ce message ? « Message supprimé » restera à sa place.")) return;
                  run(() => actions.remove(message.id));
                }}
                icon={
                  <path
                    d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12.5A1.5 1.5 0 0 0 8 21h8a1.5 1.5 0 0 0 1.5-1.5L18.5 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  icon,
  expanded,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      className="text-kov-concrete hover:text-kov-bone flex h-7 w-7 items-center justify-center transition-colors hover:bg-white/10"
      style={{ borderRadius: "var(--radius-sm)" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {icon}
      </svg>
    </button>
  );
}
