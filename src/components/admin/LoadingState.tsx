export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 w-full" style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }} />
      ))}
    </div>
  );
}
