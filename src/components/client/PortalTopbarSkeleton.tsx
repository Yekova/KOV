// Matches PortalTopbar's header height/background exactly (same wrapper
// classes) so swapping in the real topbar once PortalTopbarData resolves
// causes zero layout shift — only the content inside fades in.
export function PortalTopbarSkeleton() {
  return (
    <header className="flex items-center gap-4 px-6 py-4" style={{ background: "var(--kov-carbon)" }}>
      <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: "var(--kov-graphite)" }} />
      <div className="flex items-center gap-2 ml-auto">
        <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: "var(--kov-graphite)" }} />
        <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: "var(--kov-graphite)" }} />
      </div>
    </header>
  );
}
