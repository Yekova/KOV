import "./kovMotion.css";

// La troisième signature KOV : le trait qui se remplit.
//
// C'était un div plat de couleur unie, posé à sa largeur finale. Il ne
// disait rien du mouvement du projet — un projet à 70 % et un projet figé
// à 70 % avaient exactement le même aspect.
//
// Ici, le trait part de zéro et va jusqu'à sa valeur au premier rendu.
// L'animation n'est pas décorative : elle fait lire la progression comme
// une distance parcourue, et l'œil retient mieux un mouvement qu'une
// position. Elle ne joue qu'une fois, à l'arrivée sur la page.
//
// Le point lumineux au bout marque où on en est. Il disparaît à 0 et à
// 100 % : à zéro il n'y a rien à marquer, à cent il n'y a plus de bout.
export function KovProgress({
  percent,
  color = "var(--kov-red)",
  label,
}: {
  percent: number;
  color?: string;
  /** Décrit la barre pour un lecteur d'écran, qui ne voit pas la couleur. */
  label: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <span
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="kov-progress relative block h-1.5 w-full overflow-hidden"
      style={{ background: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
    >
      <span
        className="kov-progress__fill block h-full"
        style={{
          // La variable porte la valeur : l'animation va de 0 à celle-ci,
          // donc une même règle CSS sert toutes les barres.
          ["--kov-progress-to" as string]: `${value}%`,
          background: `linear-gradient(90deg, color-mix(in srgb, ${color} 55%, transparent) 0%, ${color} 100%)`,
          borderRadius: "var(--radius-pill)",
        }}
      />
      {value > 0 && value < 100 && (
        <span
          aria-hidden="true"
          className="kov-progress__head absolute top-1/2 block h-1.5 w-1.5 -translate-y-1/2 rounded-full"
          style={{ ["--kov-progress-to" as string]: `${value}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      )}
    </span>
  );
}
