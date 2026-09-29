import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PortalTopNavigation } from "./PortalTopNavigation";
import { PortalTopbarData } from "./PortalTopbarData";
import { PortalTopbarSkeleton } from "./PortalTopbarSkeleton";

// La barre du haut du portail, assemblée.
//
// Même découpage que côté studio (AdminNavBar) et pour la même raison : le
// compteur de demandes est une lecture en tête seule, donc la barre
// l'attend ; l'index de recherche et les notifications en demandent
// davantage, donc ils ont leur propre frontière et la barre s'affiche
// sans eux.
export async function PortalNavBar({ userId }: { userId: string }) {
  const { count: openRequestsCount } = await supabaseAdmin
    .from("request_threads")
    .select("id", { count: "exact", head: true })
    .eq("client_id", userId)
    .eq("status", "open");

  return (
    <PortalTopNavigation openRequestsCount={openRequestsCount ?? 0}>
      <Suspense fallback={<PortalTopbarSkeleton />}>
        <PortalTopbarData userId={userId} />
      </Suspense>
    </PortalTopNavigation>
  );
}
