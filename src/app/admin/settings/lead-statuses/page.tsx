import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getLeadStatuses } from "@/lib/leads/statuses";
import { LeadStatusesManager } from "./LeadStatusesManager";

export const metadata: Metadata = { title: "Statuts des leads — Admin KOV" };

export default async function LeadStatusesPage() {
  await requireAdmin();
  const statuses = await getLeadStatuses();

  return (
    <main className="px-6 py-10 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <Link href="/admin/settings" className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors">
          ← Paramètres
        </Link>
        <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">Statuts des leads</h1>
        <p className="text-kov-steel text-sm mt-1">
          L&apos;ordre ci-dessous définit les colonnes du pipeline. « Gagné » et « Perdu » sont protégés — le reste
          est entièrement à vous.
        </p>
      </div>

      <LeadStatusesManager statuses={statuses} />
    </main>
  );
}
