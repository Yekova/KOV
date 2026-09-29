// La silhouette ne couvre que la colonne centrale : la liste des
// conversations vient du layout, qui est déjà rendu quand celle-ci
// s'affiche. Même découpage que côté client.
export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Chargement" className="mx-auto w-full max-w-2xl px-6 py-14 md:px-10">
      <div
        className="kov-skeleton h-6 w-72"
        style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}
      />
      <div
        className="kov-skeleton mt-4 h-3 w-52"
        style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)", animationDelay: "80ms" }}
      />
      <div
        className="kov-skeleton mt-8 h-3 w-full max-w-md"
        style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)", animationDelay: "160ms" }}
      />
    </main>
  );
}
