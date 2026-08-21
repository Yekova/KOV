export default function AdminLoading() {
  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full">
      <div className="h-7 w-48 mb-8 animate-pulse" style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }} />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse"
            style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-md)", opacity: 1 - i * 0.08 }}
          />
        ))}
      </div>
    </main>
  );
}
