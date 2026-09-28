// Ce que le portail montre pendant qu'il charge.
//
// Il ne montrait rien : aucun loading.tsx dans tout /client. Le tableau de
// bord enchaîne six requêtes parallèles puis une septième en série, la page
// Documents signe une URL par vignette — et pendant tout ce temps, cliquer
// sur une entrée du menu ne produisait aucun changement à l'écran. Sur une
// connexion lente, on clique deux fois.
//
// Des blocs à la forme de ce qui arrive, pas un rouage qui tourne : une
// silhouette dit « ça arrive, et voilà où » ; un spinner dit seulement
// « attends ».

function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`kov-skeleton ${className}`}
      style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}
    />
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="border p-6"
      style={{
        background: "var(--glass-bg)",
        borderColor: "var(--glass-border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      {children}
    </div>
  );
}

/** La silhouette d'une page de liste : un titre, puis `rows` cartes. */
export function PortalPageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <main
      aria-busy="true"
      // Le lecteur d'écran entend « Chargement », pas la description de
      // douze rectangles gris.
      aria-label="Chargement"
      className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full"
    >
      <Block className="h-7 w-48 mb-8" />
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Card key={index}>
            <Block className="h-4 w-1/3" />
            <Block className="mt-3 h-3 w-1/5" />
            <Block className="mt-5 h-1.5 w-full" />
          </Card>
        ))}
      </div>
    </main>
  );
}

/** Le tableau de bord : deux colonnes, comme la vraie page. */
export function PortalDashboardSkeleton() {
  return (
    <main aria-busy="true" aria-label="Chargement" className="px-6 md:px-10 py-10 max-w-[1800px] mx-auto w-full">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <Block className="h-8 w-56" />
            <Block className="mt-6 h-[52px] w-full" />
            <div className="mt-6 flex gap-2">
              <Block className="h-8 w-28" />
              <Block className="h-8 w-28" />
              <Block className="h-8 w-32" />
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <Block className="h-3 w-24" />
                <Block className="mt-5 h-20 w-full" />
              </Card>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <Block className="h-3 w-28" />
              <Block className="mt-5 h-12 w-full" />
              <Block className="mt-3 h-12 w-full" />
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
