import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";

export const metadata: Metadata = { title: "Paramètres — Admin KOV" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  return (
    <ComingSoonPage
      title="Paramètres"
      description="Les paramètres d'agence, d'équipe, de notifications, d'intégrations et de permissions arrivent dans une prochaine phase."
    />
  );
}
