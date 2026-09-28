import Link from "next/link";
import type { ReactNode } from "react";

// Les états vides et les erreurs, dits utilement.
//
// Le portail écrivait « Aucun document pour l'instant. » six fois, en gris,
// sans dire ce qui remplirait l'écran ni ce qu'on peut faire. Un état vide
// est pourtant le premier écran d'un nouveau client : c'est là qu'il
// apprend à quoi sert la page.
//
// Trois parties, toujours dans cet ordre : ce qu'il n'y a pas, pourquoi et
// ce qui arrivera là, et éventuellement le geste qui remplit l'écran. La
// troisième est facultative — une page qui se remplit par le travail du
// studio n'a pas de bouton à proposer, et en inventer un serait promettre
// une action qui n'existe pas.

export function KovEmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 px-1 py-8 sm:items-center sm:py-12 sm:text-center">
      {icon && (
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center text-kov-concrete"
          style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-md)" }}
        >
          {icon}
        </span>
      )}

      <p className="text-sm text-kov-bone">
        {title}
        <span className="text-kov-red">.</span>
      </p>
      <p className="max-w-sm text-sm leading-relaxed text-kov-concrete">{description}</p>

      {action && (
        <Link
          href={action.href}
          className="mt-2 inline-flex h-10 items-center gap-2 border px-4 text-xs uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red hover:text-kov-red"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
        >
          {action.label}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}

// L'erreur, en langage de lecteur.
//
// « Error 500 » ne dit ni ce qui a échoué ni quoi faire. Le détail
// technique n'est pas supprimé pour autant : il est replié, parce qu'il
// sert le jour où l'on doit le recopier dans un message au studio.
export function KovErrorState({
  title = "Impossible de charger cette page",
  description = "Le studio est prévenu si le problème persiste. Vous pouvez réessayer tout de suite.",
  detail,
  onRetry,
}: {
  title?: string;
  description?: string;
  detail?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-10">
      <p className="text-sm text-kov-bone">
        {title}
        <span className="text-kov-red">.</span>
      </p>
      <p className="max-w-md text-sm leading-relaxed text-kov-concrete">{description}</p>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center gap-2 px-4 text-xs uppercase tracking-widest text-kov-white transition-colors hover:brightness-110"
            style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
          >
            Réessayer
          </button>
        )}
        <Link
          href="/client/requests"
          className="text-xs uppercase tracking-widest text-kov-concrete transition-colors hover:text-kov-red"
        >
          Prévenir le studio →
        </Link>
      </div>

      {detail && (
        <details className="mt-4 w-full max-w-md">
          <summary className="cursor-pointer text-xs text-kov-concrete transition-colors hover:text-kov-bone">
            Détails techniques
          </summary>
          <pre
            className="mt-2 overflow-x-auto p-3 text-[11px] leading-relaxed text-kov-concrete"
            style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}
          >
            {detail}
          </pre>
        </details>
      )}
    </div>
  );
}
