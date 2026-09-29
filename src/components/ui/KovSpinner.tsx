import "./kovMotion.css";

// Le loader KOV.
//
// Pas un cercle qui tourne : un anneau de trois segments dont un seul est
// rouge. Ce qui tourne est donc identifiable — on voit le segment rouge
// faire le tour, pas une bouillie uniforme — et la rotation peut être
// lente sans paraître bloquée.
//
// En SVG plutôt qu'en bordures CSS parce qu'il faut trois arcs distincts
// avec un espace entre eux, ce qu'une bordure ne sait pas faire.
//
// L'accent est réglable, et il le fallait : le rouge est invisible sur un
// bouton primaire, qui est rouge. Le segment identifiable disparaissait
// donc exactement là où le loader sert le plus — pendant l'envoi.
export function KovSpinner({
  size = 18,
  className = "",
  accent = "var(--kov-red)",
}: {
  size?: number;
  className?: string;
  accent?: string;
}) {
  const stroke = Math.max(1.5, size * 0.1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // Trois arcs de 24 % séparés par des trous de ~9 %.
  const arc = circumference * 0.24;
  const gap = circumference * 0.0933;

  return (
    <span
      className={`kov-spinner inline-block shrink-0 ${className}`}
      role="status"
      aria-label="Chargement"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={index === 0 ? accent : "currentColor"}
            strokeOpacity={index === 0 ? 1 : 0.28}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference - arc}`}
            strokeDashoffset={-index * (arc + gap)}
          />
        ))}
      </svg>
    </span>
  );
}

// Pour les petites opérations : trois points dont l'opacité court.
// Un anneau de 18px à côté d'un mot de six lettres est disproportionné.
export function KovInlineLoader({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5" role="status">
      {label && <span>{label}</span>}
      <span aria-hidden="true" className="kov-dots inline-flex gap-[3px]">
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}
