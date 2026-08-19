import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";

export const metadata: Metadata = { title: "Équipe — Admin KOV" };

export default async function AdminTeamPage() {
  await requireAdmin();
  return (
    <ComingSoonPage
      title="Équipe"
      description="Un vrai annuaire de l'équipe (rôles, disponibilité, charge de travail détaillée) arrive dans une prochaine phase. Un aperçu de la charge de travail existe déjà sur le tableau de bord."
    />
  );
}
