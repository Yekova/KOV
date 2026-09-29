// La silhouette de la zone de droite, aux mêmes dimensions que le vrai
// contenu : la barre est l'élément le plus haut de la page, son
// remplacement ne doit provoquer aucun saut.
export function PortalTopbarSkeleton() {
  return (
    <>
      <div
        className="kov-skeleton hidden h-[38px] w-[240px] md:block"
        style={{ background: "var(--kov-graphite)", borderRadius: "999px" }}
      />
      <div className="kov-skeleton h-9 w-9 rounded-full" style={{ background: "var(--kov-graphite)" }} />
      <div className="kov-skeleton h-9 w-9 rounded-full" style={{ background: "var(--kov-graphite)" }} />
    </>
  );
}
