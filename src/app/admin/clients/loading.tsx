import { AdminWorkspaceSkeleton } from "@/components/admin/AdminSkeleton";

// Maître-détail : la liste à gauche, la fiche du client à droite.
export default function Loading() {
  return <AdminWorkspaceSkeleton maxWidth="max-w-[1600px]" />;
}
