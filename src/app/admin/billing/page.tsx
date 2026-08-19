import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";

export const metadata: Metadata = { title: "Facturation — Admin KOV" };

export default async function AdminBillingPage() {
  await requireAdmin();
  return (
    <ComingSoonPage
      title="Facturation"
      description="Une vue agrégée de toutes les factures, tous clients confondus, arrive dans une prochaine phase. La facturation par client existe déjà sur chaque fiche client."
    />
  );
}
