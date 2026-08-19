import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";

export const metadata: Metadata = { title: "Contenu — Admin KOV" };

export default async function AdminContentPage() {
  await requireAdmin();
  return (
    <ComingSoonPage
      title="Contenu"
      description="La gestion des contenus du site (projets, études de cas, ressources) sera administrable ici, sans duplication dans le code."
    />
  );
}
