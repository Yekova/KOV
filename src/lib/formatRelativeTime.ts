export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Il y a 1 jour";
  if (diffDays < 30) return `Il y a ${diffDays} jours`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "Il y a 1 mois";
  if (diffMonths < 12) return `Il y a ${diffMonths} mois`;

  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? "Il y a 1 an" : `Il y a ${diffYears} ans`;
}
