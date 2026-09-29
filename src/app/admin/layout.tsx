import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { AdminNavBar } from "@/components/admin/AdminNavBar";
import { AdminTopNavigation } from "@/components/admin/AdminTopNavigation";
import { AdminTopbarSkeleton } from "@/components/admin/AdminTopbarSkeleton";
import { TaskPanelProvider } from "@/components/admin/tasks/TaskPanelContext";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { AdminThemeScope } from "@/components/admin/AdminThemeScope";
import { KovPageTransition } from "@/components/ui/KovPageTransition";
import "@/styles/kov-surfaces.css";
import "@/styles/kov-light.css";

// La coquille de l'admin, en clair et à l'horizontale.
//
// ── CE QUI A CHANGÉ, ET CE QUI N'A PAS BOUGÉ ─────────────────────────
//
// La barre latérale a disparu au profit d'une barre horizontale. Le gain
// n'est pas esthétique : la latérale mangeait 240 pixels sur toute la
// hauteur, sur des écrans où le pipeline commercial et les tables de
// projets manquent de largeur.
//
// La bascule en clair, elle, ne touche AUCUNE page. `.kov-admin`
// redéfinit les tokens de couleur, et comme Tailwind est déclaré en
// `@theme inline`, les 1439 classes `kov-*` et les 637 `var(--kov-*)` des
// pages suivent sans être modifiées (voir styles/kov-light.css). La
// portée est obligatoire : le site public et l'espace client partagent ces
// composants et restent sombres.
//
// ── LA RAISON DES FRONTIÈRES SUSPENSE N'A PAS CHANGÉ ─────────────────
//
// requireAdmin() lit les cookies, ce qui rend ce layout dynamique — et,
// d'après la documentation de Next, un loading.tsx placé sous un layout ne
// peut rien afficher tant que le LAYOUT lui-même charge. Cette fonction
// fait donc le strict minimum (l'authentification) et tout le reste est
// poussé dans sa propre frontière, pour que {children} — la page — ne soit
// jamais retardé par les compteurs ni par l'index de recherche.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  return (
    <div className="kov-admin min-h-screen" style={{ background: "var(--kov-black)" }}>
      {/* Ne rend rien : étend la portée du thème clair au <body>, pour que
          les menus et modales portés par createPortal — dix composants —
          ne se rendent pas en palette sombre au milieu d'une page claire. */}
      <AdminThemeScope />

      {/* Le fond abstrait n'occupe que le haut : sous une table de projets,
          un dégradé corail entre en concurrence avec les chiffres, qui sont
          la seule chose qu'on vient y lire. */}
      <div className="kov-admin__backdrop" aria-hidden="true" />

      <div className="kov-admin__content flex min-h-screen flex-col">
        <Suspense
          fallback={
            <AdminTopNavigation badgeCounts={{}}>
              <AdminTopbarSkeleton />
            </AdminTopNavigation>
          }
        >
          <AdminNavBar userId={user.id} />
        </Suspense>

        <div className="flex-1">
          <AdminProviders>
            <TaskPanelProvider>
              <KovPageTransition>{children}</KovPageTransition>
            </TaskPanelProvider>
          </AdminProviders>
        </div>
      </div>
    </div>
  );
}
