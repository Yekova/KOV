// Matches AdminTopbar's header height/background exactly (same wrapper
// classes) so swapping in the real topbar once AdminTopbarData resolves
// causes zero layout shift — only the content inside fades in.
export function AdminTopbarSkeleton() {
  return (
    <header className="flex items-center gap-4 px-6 py-4" style={{ background: "var(--kov-carbon)" }}>
      <div
        className="flex-1 max-w-md h-[42px] border animate-pulse"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-lg)", background: "var(--kov-graphite)" }}
      />
      <div
        className="w-[168px] h-[42px] animate-pulse"
        style={{ borderRadius: "var(--radius-sm)", background: "var(--kov-graphite)" }}
      />
      <div className="flex items-center gap-2 ml-auto">
        <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: "var(--kov-graphite)" }} />
        <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: "var(--kov-graphite)" }} />
      </div>
    </header>
  );
}
