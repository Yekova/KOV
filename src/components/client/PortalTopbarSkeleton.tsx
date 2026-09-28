// Reproduit la hauteur et le fond de PortalTopbar au pixel (mêmes classes
// d'enveloppe) pour que l'échange, une fois PortalTopbarData résolu, ne
// décale rien — seul le contenu apparaît. La barre de recherche en fait
// partie depuis qu'elle a rejoint la coquille : sans sa silhouette, tout ce
// qui suit sautait de place à l'arrivée des données.
export function PortalTopbarSkeleton() {
  return (
    <header className="flex items-center gap-4 px-6 py-4" style={{ background: "var(--kov-carbon)" }}>
      <div className="kov-skeleton w-10 h-10 rounded-full md:hidden" style={{ background: "var(--kov-graphite)" }} />
      <div className="kov-skeleton h-11 w-full max-w-xl rounded-full" style={{ background: "var(--kov-graphite)" }} />
      <div className="flex items-center gap-2 ml-auto">
        <div className="kov-skeleton w-9 h-9 rounded-full" style={{ background: "var(--kov-graphite)" }} />
        <div className="kov-skeleton w-9 h-9 rounded-full" style={{ background: "var(--kov-graphite)" }} />
      </div>
    </header>
  );
}
