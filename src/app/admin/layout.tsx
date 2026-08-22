import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarBadges } from "@/components/admin/SidebarBadges";
import { AdminTopbarData } from "@/components/admin/AdminTopbarData";
import { AdminTopbarSkeleton } from "@/components/admin/AdminTopbarSkeleton";
import { MobileNavProvider } from "@/components/ui/MobileNavContext";

// requireAdmin() reads cookies(), which makes this whole layout dynamic —
// per Next.js's own docs, a loading.tsx in a page below this layout cannot
// show a fallback while the LAYOUT itself is still fetching (navigation
// blocks until it resolves). The fix: keep this function itself doing as
// little as possible (just the auth check), and push every other query into
// its own Suspense boundary below, so route transitions are never gated on
// the sidebar badge counts or the (9-query) search index — {children} (the
// actual page) streams independently of both.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  return (
    <MobileNavProvider>
      <div className="min-h-screen flex" style={{ background: "var(--kov-black)" }}>
        <Suspense fallback={<AdminSidebar badgeCounts={{}} />}>
          <SidebarBadges />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0">
          <Suspense fallback={<AdminTopbarSkeleton />}>
            <AdminTopbarData userId={user.id} />
          </Suspense>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </MobileNavProvider>
  );
}
