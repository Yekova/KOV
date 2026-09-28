import { PortalPageSkeleton } from "@/components/client/PortalSkeleton";

// La silhouette ne couvre que la colonne centrale : la liste vient du
// layout, qui est déjà rendu quand celle-ci s'affiche.
export default function Loading() {
  return <PortalPageSkeleton rows={2} />;
}
