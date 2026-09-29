import Link from "next/link";

// L'état vide de l'admin.
//
// Il n'affichait qu'une phrase grise : « Aucun lead pour l'instant. » Ça
// dit ce qu'il n'y a pas, jamais ce qui remplira l'écran ni ce qu'on peut
// faire — et c'est pourtant le premier écran d'une section qu'on ouvre
// pour la première fois.
//
// Même structure que celui du portail (KovEmptyState) : ce qu'il n'y a
// pas, pourquoi et ce qui arrivera là, et éventuellement le geste qui
// remplit l'écran. Les deux dernières sont facultatives — une liste qui se
// remplit toute seule n'a pas de bouton à proposer, et en inventer un
// serait promettre une action qui n'existe pas.
//
// `message` reste le seul argument obligatoire pour que les treize appels
// existants continuent de fonctionner sans être réécrits ; ils gagnent
// simplement la mise en forme.
export function EmptyState({
  message,
  description,
  action,
}: {
  message: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  // Les messages existants finissent par un point ; le point rouge le
  // remplace, sinon on en lirait deux.
  const title = message.replace(/\.\s*$/, "");

  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kov/brand/kov-monogram-k-transparent.png"
        alt=""
        aria-hidden="true"
        className="w-10 h-auto mb-4 select-none"
        style={{ opacity: 0.18 }}
      />

      <p className="text-kov-bone text-sm">
        {title}
        <span className="text-kov-red">.</span>
      </p>

      {description && (
        <p className="text-kov-steel mt-2 max-w-sm text-sm leading-relaxed">{description}</p>
      )}

      {action && (
        <Link
          href={action.href}
          className="text-kov-bone hover:border-kov-red hover:text-kov-red mt-5 inline-flex h-10 items-center gap-2 border px-4 text-xs tracking-widest uppercase transition-colors"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
        >
          {action.label}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
