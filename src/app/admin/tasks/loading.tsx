import { AdminListSkeleton } from "@/components/admin/AdminSkeleton";

// Voir AdminSkeleton : une silhouette à la forme de la page qui arrive.
export default function Loading() {
  return <AdminListSkeleton stats={5} rows={9} maxWidth="max-w-[1800px]" />;
}
