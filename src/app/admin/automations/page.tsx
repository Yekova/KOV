import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";

export const metadata: Metadata = { title: "Automatisations — Admin KOV" };

export default async function AdminAutomationsPage() {
  await requireAdmin();
  return (
    <ComingSoonPage
      title="Automatisations"
      description="Les règles automatiques (relances, assignations, notifications) arrivent dans une prochaine phase."
    />
  );
}
