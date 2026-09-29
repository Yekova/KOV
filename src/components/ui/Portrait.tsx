// Le portrait d'un membre de l'équipe : gris au repos, en couleur au survol.
//
// Pourquoi cette règle plutôt qu'une photo toujours en couleur : le portail
// est une identité sombre et rouge, et une photographie en couleurs pleines
// y est la chose la plus bruyante de l'écran — elle attire l'œil avant les
// chiffres et les actions. En gris, elle fait partie de la surface ; en
// couleur, elle répond. C'est la seule chose du portail qui s'allume quand
// on la regarde, ce qui est exactement ce qu'on veut d'un visage humain au
// milieu de factures et d'échéances.
//
// Le filtre s'applique à l'image, pas à son conteneur : la pastille de
// présence et l'initiale de repli doivent garder leur couleur.
//
// Sous prefers-reduced-motion, la transition disparaît mais l'effet reste —
// ce réglage demande d'arrêter le mouvement, pas de supprimer un changement
// d'état au survol.
//
// Pas un composant client : il n'a ni état ni gestionnaire, tout est en CSS.
// Un survol n'a jamais eu besoin de JavaScript.

export function Portrait({
  src,
  name,
  size = 48,
  /** Vrai / faux affiche la pastille ; undefined ne l'affiche pas du tout. */
  isOnline,
  className = "",
}: {
  src: string | null;
  name: string | null;
  size?: number;
  isOnline?: boolean;
  className?: string;
}) {
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "K";

  return (
    <span className={`kov-portrait relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <span
        className="flex h-full w-full items-center justify-center overflow-hidden"
        style={{
          borderRadius: "var(--radius-pill)",
          background: "var(--kov-graphite)",
          border: "1px solid var(--kov-border)",
        }}
      >
        {src ? (
          // alt vide : le nom est écrit juste à côté dans tous les usages, et
          // l'entendre deux fois n'apprend rien.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="kov-portrait__img h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true" className="font-display text-kov-concrete" style={{ fontSize: size * 0.36 }}>
            {initial}
          </span>
        )}
      </span>

      {isOnline !== undefined && (
        <span
          // La pastille est doublée par un title : une information portée par
          // la seule couleur est perdue pour une partie des lecteurs.
          title={isOnline ? "En ligne" : "Hors ligne"}
          className="absolute bottom-0 right-0 block"
          style={{
            width: Math.max(8, size * 0.2),
            height: Math.max(8, size * 0.2),
            borderRadius: "var(--radius-pill)",
            background: isOnline ? "var(--kov-status-green)" : "var(--kov-steel)",
            border: "2px solid var(--kov-carbon)",
          }}
        />
      )}
    </span>
  );
}
