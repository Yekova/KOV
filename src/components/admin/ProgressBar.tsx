export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <div
      className={`h-1.5 w-full overflow-hidden ${className}`}
      style={{ background: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
    >
      <div
        className="h-full"
        style={{ width: `${Math.max(0, Math.min(100, percent))}%`, background: "var(--kov-red)" }}
      />
    </div>
  );
}
