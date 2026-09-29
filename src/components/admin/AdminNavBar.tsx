import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { countRequestsWaitingOnUs } from "@/lib/admin/requests";
import { AdminTopNavigation } from "./AdminTopNavigation";
import { AdminTopbarData } from "./AdminTopbarData";
import { AdminTopbarSkeleton } from "./AdminTopbarSkeleton";

// La barre du haut, assemblée.
//
// Elle réunit ce qui vivait dans deux endroits : les compteurs qui
// alimentaient les pastilles de la barre latérale, et la zone d'actions de
// l'ancienne barre du haut. Avec une navigation horizontale, les deux sont
// dans la MÊME barre — mais ils ne viennent pas de la même requête, et
// c'est ce que la double frontière ci-dessous préserve.
//
// Les compteurs sont trois lectures en tête seule : rapides, donc la barre
// les attend. L'index de recherche en fait douze : il a sa propre
// frontière, et la barre s'affiche sans lui.
//
// Fondre les deux ferait attendre la navigation entière pour une palette
// de recherche que personne n'a encore ouverte.
export async function AdminNavBar({ userId }: { userId: string }) {
  const [{ count: newLeadsBadge }, { count: pendingTasksBadge }, requestsBadge] = await Promise.all([
    supabaseAdmin.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabaseAdmin
      .from("project_tasks")
      .select("id", { count: "exact", head: true })
      .in("status", ["backlog", "todo", "blocked"]),
    // Pas « les fils ouverts » mais « ceux dont la balle est chez nous » :
    // un badge qui compte aussi ce qu'on attend du client demanderait de
    // l'ouvrir pour savoir s'il appelle une action.
    countRequestsWaitingOnUs(),
  ]);

  return (
    <AdminTopNavigation
      badgeCounts={{
        leads: newLeadsBadge ?? 0,
        tasks: pendingTasksBadge ?? 0,
        requests: requestsBadge,
      }}
    >
      <Suspense fallback={<AdminTopbarSkeleton />}>
        <AdminTopbarData userId={userId} />
      </Suspense>
    </AdminTopNavigation>
  );
}
