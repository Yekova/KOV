import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";

export const metadata: Metadata = { title: "Analytics — Admin KOV" };

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  return (
    <ComingSoonPage
      title="Analytics"
      description="Aucun outil d'analytics (sessions, taux de conversion, etc.) n'est encore connecté à ce projet — cette page reste vide plutôt que d'afficher des chiffres inventés. Elle s'activera dès qu'une vraie source de données sera branchée."
    />
  );
}
