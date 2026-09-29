// La silhouette de la zone de droite, aux mêmes dimensions que le vrai
// contenu : l'arrivée d'AdminTopbarData ne doit provoquer aucun saut, la
// barre étant l'élément le plus haut de la page.
export function AdminTopbarSkeleton() {
  return (
    <>
      <div
        className="kov-skeleton hidden h-[38px] w-[240px] md:block"
        style={{ background: "var(--kov-graphite)", borderRadius: "12px" }}
      />
      <div className="kov-skeleton h-[38px] w-[150px]" style={{ background: "var(--kov-graphite)", borderRadius: "10px" }} />
      <div className="kov-skeleton h-9 w-9 rounded-full" style={{ background: "var(--kov-graphite)" }} />
      <div className="kov-skeleton h-9 w-9 rounded-full" style={{ background: "var(--kov-graphite)" }} />
    </>
  );
}
