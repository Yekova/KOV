"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// Le choix d'emoji, sans dépendance.
//
// Une bibliothèque de sélecteur d'emoji pèse plusieurs centaines de
// kilo-octets et embarque sa propre feuille de style, ses propres icônes
// et souvent une image de tous les emoji. Pour une messagerie de studio,
// quelques rangées de caractères suffisent — ce sont des caractères
// Unicode, la police du système les dessine.
//
// L'insertion se fait AU CURSEUR et non à la fin : on écrit souvent
// l'emoji au milieu d'une phrase, et réécrire la fin du message parce que
// le caractère s'est collé après le point est une punition.

const GROUPS: { label: string; emojis: string[] }[] = [
  { label: "Réactions", emojis: ["👍", "👏", "🙌", "🤝", "💪", "🙏", "✅", "❤️", "🔥", "✨"] },
  { label: "Humeurs", emojis: ["🙂", "😀", "😄", "😅", "😉", "🤔", "😬", "😐", "🥲", "🤩"] },
  { label: "Travail", emojis: ["📌", "📎", "📅", "⏳", "⚠️", "🚀", "🎯", "📝", "💡", "🔧"] },
];

export function EmojiPicker({
  targetRef,
  onInserted,
}: {
  /** Le champ dans lequel écrire. */
  targetRef: RefObject<HTMLTextAreaElement | null>;
  /** Prévient le parent qu'il doit relire la valeur (champ contrôlé). */
  onInserted?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Échap ferme, et un clic ailleurs aussi. Sans ça, le panneau reste
  // ouvert par-dessus le fil quand on repart écrire.
  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  function insert(emoji: string) {
    const field = targetRef.current;
    if (!field) return;

    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? start;
    const next = field.value.slice(0, start) + emoji + field.value.slice(end);

    field.value = next;
    onInserted?.(next);

    // Le curseur repasse APRÈS l'emoji et le champ reprend le focus :
    // sinon la frappe suivante repart du début du message.
    field.focus();
    const caret = start + emoji.length;
    field.setSelectionRange(caret, caret);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Insérer un emoji"
        title="Insérer un emoji"
        className="text-kov-concrete hover:text-kov-bone flex h-9 w-9 items-center justify-center transition-colors"
        style={{ borderRadius: "var(--radius-sm)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8.5 14.2c.9 1.1 2.1 1.7 3.5 1.7s2.6-.6 3.5-1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="9.2" cy="9.8" r="1.05" fill="currentColor" />
          <circle cx="14.8" cy="9.8" r="1.05" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Emoji"
          className="kov-enter absolute bottom-full left-0 z-30 mb-2 w-[268px] p-3"
          style={{
            background: "var(--kov-graphite)",
            border: "1px solid var(--kov-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 24px 48px -24px rgba(0,0,0,0.9)",
          }}
        >
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-2 last:mb-0">
              <p className="text-kov-concrete mb-1 text-[10px] tracking-widest uppercase">{group.label}</p>
              <div className="grid grid-cols-10 gap-0.5">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insert(emoji)}
                    aria-label={emoji}
                    className="flex h-6 w-6 items-center justify-center text-[15px] leading-none transition-colors kov-hover-strong"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
