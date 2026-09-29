import { AdminDashboardSkeleton } from "@/components/admin/AdminSkeleton";

// Le tableau de bord enchaîne quatorze requêtes parallèles : c'est la page
// de l'admin qui attend le plus longtemps, et celle qui n'annonçait rien.
export default function Loading() {
  return <AdminDashboardSkeleton />;
}
