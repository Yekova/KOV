import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type LeadInteractionType = "email" | "phone" | "meeting" | "note" | "form" | "proposal" | "follow_up" | "status_change";

// The lead-side equivalent of logActivity() — see the lead_interactions
// migration for why this can't just reuse activity_log (client_id NOT NULL,
// a lead has no profiles row until it converts).
export async function logLeadInteraction(params: {
  leadId: string;
  type: LeadInteractionType;
  actorId?: string | null;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await supabaseAdmin.from("lead_interactions").insert({
    lead_id: params.leadId,
    type: params.type,
    actor_id: params.actorId ?? null,
    content: params.content ?? null,
    metadata: params.metadata ?? null,
  });
}
