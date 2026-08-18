"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const LEAD_STATUSES = ["new", "contacted", "won", "lost"] as const;
type LeadStatus = (typeof LEAD_STATUSES)[number];

function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export async function updateLeadStatus(leadId: string, status: string) {
  await requireAdmin();

  if (!isLeadStatus(status)) {
    throw new Error("Statut invalide.");
  }

  const { error } = await supabaseAdmin.from("leads").update({ status }).eq("id", leadId);

  if (error) {
    throw new Error("La mise à jour du statut a échoué.");
  }

  revalidatePath("/admin");
}
