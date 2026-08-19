const TONE_COLORS: Record<"neutral" | "positive" | "warning" | "danger", string> = {
  neutral: "var(--kov-steel)",
  positive: "var(--kov-bone)",
  warning: "var(--kov-red-signal)",
  danger: "var(--kov-red)",
};

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-widest border"
      style={{ color: TONE_COLORS[tone], borderColor: TONE_COLORS[tone], borderRadius: "var(--radius-pill)" }}
    >
      {label}
    </span>
  );
}
