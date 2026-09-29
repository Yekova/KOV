import { AdminListSkeleton } from "@/components/admin/AdminSkeleton";

// Voir AdminSkeleton : une silhouette à la forme de la page qui arrive.
export default function Loading() {
  return <AdminListSkeleton stats={4} rows={8} maxWidth="max-w-[1600px]" />;
}
