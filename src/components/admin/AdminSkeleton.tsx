// Ce que l'admin montre pendant qu'il charge.
//
// Il montrait un seul loading.tsx, à la racine : un titre et six barres
// grises, les mêmes pour les trente-neuf pages. Or le tableau de bord
// enchaîne quatorze requêtes parallèles, la page Leads en fait quatre dont
// un entonnoir et un anneau, et la page Clients ouvre un maître-détail en
// deux colonnes. La silhouette générique ne ressemblait à aucune des
// trois : elle annonçait une liste, puis une tout autre page arrivait.
//
// Des blocs à la forme de ce qui arrive, pas un rouage qui tourne : une
// silhouette dit « ça arrive, et voilà où » ; un spinner dit seulement
// « attends ». C'est la règle déjà appliquée au portail client
// (PortalSkeleton), reprise ici avec les grilles réelles de l'admin.

function Block({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={`kov-skeleton ${className}`}
      style={{
        background: "var(--kov-graphite)",
        borderRadius: "var(--radius-sm)",
        // Le décalage fait courir la pulsation le long de la page au lieu
        // de faire clignoter trente blocs à l'unisson, ce qui attire l'œil
        // sur l'attente elle-même.
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`border p-5 ${className}`}
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
    >
      {children}
    </div>
  );
}

/** L'en-tête commun : le titre, et le bouton d'action à droite. */
function Header({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <Block className="h-7 w-44" />
      {withAction && <Block className="h-10 w-40" delay={80} />}
    </div>
  );
}

// Les classes sont écrites en toutes lettres et non construites : Tailwind
// lit le source, donc une classe fabriquée à l'exécution n'est jamais
// générée et la grille retombe silencieusement sur une colonne.
const STAT_GRID: Record<number, string> = {
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

/** Une rangée d'indicateurs, comme StatCard/KpiCard. */
function StatRow({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${STAT_GRID[count] ?? STAT_GRID[4]}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <Block className="h-3 w-24" delay={index * 90} />
          <Block className="mt-4 h-7 w-20" delay={index * 90 + 45} />
          <Block className="mt-3 h-3 w-28" delay={index * 90 + 90} />
        </Card>
      ))}
    </div>
  );
}

/** Le tableau de bord : indicateurs, puis quatre bandes de trois colonnes. */
export function AdminDashboardSkeleton() {
  return (
    <main aria-busy="true" aria-label="Chargement" className="mx-auto w-full max-w-[1800px] space-y-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Block className="h-8 w-64" />
          <Block className="mt-3 h-3 w-40" delay={60} />
        </div>
        <Block className="h-10 w-36" delay={120} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <Block className="h-3 w-20" delay={index * 70} />
            <Block className="mt-4 h-7 w-16" delay={index * 70 + 40} />
          </Card>
        ))}
      </div>

      {Array.from({ length: 3 }).map((_, band) => (
        <div key={band} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <Block className="h-3 w-32" delay={band * 120} />
            <Block className="mt-5 h-40 w-full" delay={band * 120 + 60} />
          </Card>
          <Card>
            <Block className="h-3 w-28" delay={band * 120 + 90} />
            <Block className="mt-5 h-12 w-full" delay={band * 120 + 130} />
            <Block className="mt-3 h-12 w-full" delay={band * 120 + 170} />
            <Block className="mt-3 h-12 w-full" delay={band * 120 + 210} />
          </Card>
        </div>
      ))}
    </main>
  );
}

/**
 * Une page de liste : titre, indicateurs, puis des lignes.
 * `maxWidth` suit celle de la vraie page — une silhouette large qui devient
 * une page étroite fait sauter toute la mise en page à l'arrivée.
 */
export function AdminListSkeleton({
  stats = 4,
  rows = 8,
  maxWidth = "max-w-[1600px]",
  withTabs = false,
}: {
  stats?: number;
  rows?: number;
  maxWidth?: string;
  withTabs?: boolean;
}) {
  return (
    <main aria-busy="true" aria-label="Chargement" className={`mx-auto w-full ${maxWidth} space-y-8 px-6 py-10`}>
      <Header />
      {stats > 0 && <StatRow count={stats} />}

      {withTabs && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Block key={index} className="h-9 w-28" delay={index * 70} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Block key={index} className="h-14 w-full" delay={index * 60} />
        ))}
      </div>
    </main>
  );
}

/** Le maître-détail : la liste à gauche, le panneau à droite. */
export function AdminWorkspaceSkeleton({ maxWidth = "max-w-[1600px]" }: { maxWidth?: string }) {
  return (
    <main aria-busy="true" aria-label="Chargement" className={`mx-auto w-full ${maxWidth} px-6 py-10`}>
      <Header />
      <div className="xl:grid xl:grid-cols-[1fr_340px] xl:items-start xl:gap-6">
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <Block key={index} className="h-16 w-full" delay={index * 60} />
          ))}
        </div>
        <div className="mt-6 space-y-4 xl:mt-0">
          <Card>
            <Block className="h-3 w-24" delay={120} />
            <Block className="mt-4 h-20 w-full" delay={170} />
          </Card>
          <Card>
            <Block className="h-3 w-28" delay={220} />
            <Block className="mt-4 h-32 w-full" delay={270} />
          </Card>
        </div>
      </div>
    </main>
  );
}

/** La fiche d'un enregistrement : un en-tête, puis des sections. */
export function AdminDetailSkeleton({ maxWidth = "max-w-5xl" }: { maxWidth?: string }) {
  return (
    <main aria-busy="true" aria-label="Chargement" className={`mx-auto w-full ${maxWidth} space-y-8 px-6 py-10`}>
      <div>
        <Block className="h-3 w-24" />
        <Block className="mt-4 h-8 w-72" delay={60} />
        <Block className="mt-3 h-3 w-48" delay={110} />
      </div>

      {Array.from({ length: 3 }).map((_, section) => (
        <Card key={section}>
          <Block className="h-3 w-32" delay={section * 130} />
          <div className="mt-5 space-y-3">
            <Block className="h-11 w-full" delay={section * 130 + 60} />
            <Block className="h-11 w-full" delay={section * 130 + 100} />
            <Block className="h-11 w-2/3" delay={section * 130 + 140} />
          </div>
        </Card>
      ))}
    </main>
  );
}
