import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLeadStatuses } from "@/lib/leads/statuses";

// The single place that turns a lead row (+ its owner, + its latest quote)
// into the values map resolveVariables() substitutes into a template. See
// src/lib/email/variables.ts for the catalog these keys must match.
export async function buildLeadVariableValues(leadId: string): Promise<Record<string, string>> {
  const [{ data: lead }, statuses] = await Promise.all([
    supabaseAdmin.from("leads").select("*").eq("id", leadId).maybeSingle(),
    getLeadStatuses(),
  ]);
  if (!lead) return {};

  let ownerName = "";
  let ownerEmail = "";
  if (lead.assigned_to) {
    const { data: owner } = await supabaseAdmin.from("profiles").select("full_name, email").eq("id", lead.assigned_to).maybeSingle();
    ownerName = owner?.full_name ?? "";
    ownerEmail = owner?.email ?? "";
  }

  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("reference, total_cents")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const statusLabel = statuses.find((s) => s.key === lead.status)?.label ?? "";

  const firstName: string = lead.first_name || "";
  const lastName: string = lead.last_name || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || lead.name || "";
  // The core fallback chain the spec calls out explicitly (section 9):
  // civility + last name when both exist, otherwise fall back to the first
  // name alone rather than printing a half-empty "Bonjour  Dupont,".
  const greetingName = lead.title && lastName ? `${lead.title} ${lastName}` : firstName || fullName;

  return {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    title: lead.title ?? "",
    greeting_name: greetingName,
    company: lead.company ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    website: lead.website ?? "",
    company_name: lead.company ?? "",
    project_name: lead.project_type ?? "",
    project_type: lead.project_type ?? "",
    project_description: lead.message ?? "",
    lead_status: statusLabel,
    lead_score: lead.score !== null && lead.score !== undefined ? String(lead.score) : "",
    estimated_value: lead.budget_cents ? `${(lead.budget_cents / 100).toLocaleString("fr-FR")} €` : "",
    owner_name: ownerName,
    owner_email: ownerEmail,
    owner_phone: "",
    meeting_date: "",
    meeting_time: "",
    quote_number: quote?.reference ?? "",
    quote_amount: quote?.total_cents ? `${(quote.total_cents / 100).toLocaleString("fr-FR")} €` : "",
  };
}
