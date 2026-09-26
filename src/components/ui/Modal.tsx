"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

// La modale de l'admin, écrite une fois.
//
// Le même bloc « fond noir + GlassCard + onClick pour fermer » était
// recopié dans cinq fichiers. Aucune de ces copies ne piégeait le focus, ne
// réagissait à Échap, ne rendait le focus à son ouverture, ni n'arrêtait le
// défilement derrière — alors que lockScroll() existe depuis longtemps et
// n'était appelé que par la fiche projet du site public.
//
// ── POURQUOI PAS UN <dialog> NATIF ───────────────────────────────────────
//
// C'est la question qu'on se posera en relisant ce fichier, et la réponse
// n'est pas « par habitude ». Un <dialog> ouvert avec showModal() monte
// dans la couche supérieure du navigateur, qui donne gratuitement le piège
// de focus, Échap et l'inertie du reste de la page.
//
// Mais Select (src/components/ui/Select.tsx) porte sa liste d'options vers
// document.body, qui n'est PAS dans cette couche supérieure. Une liste
// déroulante ouverte à l'intérieur d'un <dialog> modal s'afficherait donc
// derrière lui et serait incliquable. Les modales actuelles fonctionnent
// précisément parce que les deux sont des portails ordinaires sur body, au
// même plan.
//
// Tant que Select portera vers body, cette modale doit rester un div.

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  footer,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg";
  footer?: ReactNode;
  /** À mettre à false quand fermer par mégarde perdrait une saisie. */
  closeOnBackdrop?: boolean;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  const focusables = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return [] as HTMLElement[];
    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
  }, []);

  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    lockScroll();

    // Le premier champ plutôt que le panneau lui-même : une modale de
    // formulaire s'ouvre pour être remplie.
    const first = focusables()[0] ?? panelRef.current;
    first?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // Le piège de focus. Sans lui, la tabulation sort de la modale et
      // continue dans une page que l'utilisateur ne voit plus.
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      unlockScroll();
      restoreFocusTo.current?.focus?.();
    };
  }, [open, onClose, focusables]);

  if (!open) return null;

  const maxWidth = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return createPortal(
    <div
      className="fixed inset-0 flex items-start justify-center px-4 py-10 overflow-y-auto"
      style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      {/* variant="solid" est obligatoire, pas décoratif : GlassCard
          explique dans son propre fichier que backdrop-filter casse la
          détection de clic des listes natives à l'intérieur. */}
      <GlassCard
        variant="solid"
        className={`w-full ${maxWidth} p-6`}
        onClick={(event) => event.stopPropagation()}
      >
        <div ref={panelRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-kov-bone text-lg uppercase">{title}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="text-kov-steel hover:text-kov-red transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {children}

          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </GlassCard>
    </div>,
    document.body
  );
}
