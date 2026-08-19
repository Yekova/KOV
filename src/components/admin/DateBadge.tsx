export function DateBadge({ date, isOverdue = false }: { date: string; isOverdue?: boolean }) {
  return (
    <span
      className="text-xs whitespace-nowrap"
      style={{ color: isOverdue ? "var(--kov-red)" : "var(--kov-steel)" }}
    >
      {new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
    </span>
  );
}
