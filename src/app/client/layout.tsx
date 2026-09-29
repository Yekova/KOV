import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { PortalSidebar } from "@/components/client/PortalSidebar";
import { ClientSidebarBadges } from "@/components/client/ClientSidebarBadges";
import { PortalTopbarData } from "@/components/client/PortalTopbarData";
import { PortalTopbarSkeleton } from "@/components/client/PortalTopbarSkeleton";
import { MobileNavProvider } from "@/components/ui/MobileNavContext";
import { PortalProviders } from "@/components/client/PortalProviders";
import { KovPageTransition } from "@/components/ui/KovPageTransition";
import { PresenceHeartbeat } from "@/components/client/PresenceHeartbeat";
import { BrowserAlerts } from "@/components/client/BrowserAlerts";
import "@/styles/kov-surfaces.css";
import "./portal.css";

// requireUser() reads cookies(), which makes this whole layout dynamic —
// per Next.js's own docs, a loading.js in a page below this layout cannot
// show a fallback while the LAYOUT itself is still fetching (navigation
// blocks until it resolves). Same fix as the admin shell: keep this
// function doing as little as possible (just the auth check), and push
// every other query into its own Suspense boundary below, so route
// transitions are never gated on the sidebar's badge count or the topbar's
// notification feed — {children} (the actual page) streams independently
// of both.
export default async function ClientLayout({ children }: LayoutProps<"/client">) {
  const user = await requireUser();

  return (
    <PortalProviders>
      {/* Ne rend rien : tient profiles.is_online à jour tant que l'espace
          client est ouvert. Voir le composant pour ce que ça ne peut pas
          faire. */}
      <PresenceHeartbeat />
      {/* Ne rend rien : sonde « y a-t-il du nouveau ? » et alerte hors de
          l'onglet quand l'autorisation a été donnée. */}
      <BrowserAlerts />
      <MobileNavProvider>
        <div className="kov-portal min-h-screen flex" style={{ background: "var(--kov-black)" }}>
          <Suspense fallback={<PortalSidebar openRequestsCount={0} />}>
            <ClientSidebarBadges userId={user.id} />
          </Suspense>
          <div className="flex-1 flex flex-col min-w-0">
            <Suspense fallback={<PortalTopbarSkeleton />}>
              <PortalTopbarData userId={user.id} />
            </Suspense>
            <KovPageTransition className="flex-1">{children}</KovPageTransition>
          </div>
        </div>
      </MobileNavProvider>
    </PortalProviders>
  );
}
