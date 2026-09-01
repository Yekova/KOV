import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { computeLeadScore } from "./scoring";

// Recomputes and persists one lead's score — called after anything that
// changes a scoring input (status change, new interaction). Not a DB
// trigger on purpose: the formula lives in application code, in one place
// (src/lib/leads/scoring.ts), easy to iterate on without a migration each
// time. Split into its own file so the pure formula in scoring.ts can be
// imported from client components (LeadCard, LeadsListView) without
// pulling in supabaseAdmin.
export async function recomputeLeadScore(leadId: string): Promise<void> {
  const [{ data: lead }, { count: interactionCount }] = await Promise.all([
    supabaseAdmin.from("leads").select("status, source, budget_cents, created_at").eq("id", leadId).maybeSingle(),
    supabaseAdmin.from("lead_interactions").select("id", { count: "exact", head: true }).eq("lead_id", leadId),
  ]);
  if (!lead) return;

  const { data: statusRow } = await supabaseAdmin.from("lead_statuses").select("is_won, is_lost").eq("key", lead.status).maybeSingle();

  const score = computeLeadScore({
    status: lead.status,
    statusIsWon: statusRow?.is_won ?? false,
    statusIsLost: statusRow?.is_lost ?? false,
    source: lead.source,
    budgetCents: lead.budget_cents,
    createdAt: lead.created_at,
    interactionCount: interactionCount ?? 0,
  });

  await supabaseAdmin.from("leads").update({ score }).eq("id", leadId);
}
