import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { PortalSidebar } from "@/components/client/PortalSidebar";
import { ClientSidebarBadges } from "@/components/client/ClientSidebarBadges";
import { PortalTopbarData } from "@/components/client/PortalTopbarData";
import { PortalTopbarSkeleton } from "@/components/client/PortalTopbarSkeleton";
import { MobileNavProvider } from "@/components/ui/MobileNavContext";

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
    <MobileNavProvider>
      <div className="min-h-screen flex" style={{ background: "var(--kov-black)" }}>
        <Suspense fallback={<PortalSidebar openRequestsCount={0} />}>
          <ClientSidebarBadges userId={user.id} />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0">
          <Suspense fallback={<PortalTopbarSkeleton />}>
            <PortalTopbarData userId={user.id} />
          </Suspense>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </MobileNavProvider>
  );
}
