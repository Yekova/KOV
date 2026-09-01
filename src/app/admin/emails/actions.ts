"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildLeadVariableValues } from "@/lib/email/leadVariables";
import { sendLeadEmail } from "@/lib/email/sendLeadEmail";
import { EMAIL_STATUS_LABELS, isEmailStatus } from "@/lib/admin/status";

export interface ComposerTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  bodyHtml: string;
  isFavorite: boolean;
}

export interface ComposerSignature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface ComposerData {
  lead: { id: string; name: string; email: string; title: string | null; company: string | null } | null;
  variableValues: Record<string, string>;
  templates: ComposerTemplate[];
  signatures: ComposerSignature[];
  recentTemplateIds: string[];
}

// Everything the composer needs in one round trip, opened from a lead's
// fiche — the variable values are pre-resolved server-side so the preview
// never needs a second request while typing.
export async function getComposerData(leadId: string): Promise<ComposerData> {
  const admin = await requireAdmin();

  const [{ data: lead }, variableValues, { data: templates }, { data: signatures }, { data: recentLogs }] = await Promise.all([
    supabaseAdmin.from("leads").select("id, name, email, title, company").eq("id", leadId).maybeSingle(),
    buildLeadVariableValues(leadId),
    supabaseAdmin
      .from("email_templates")
      .select("id, name, category, subject, body_html, is_favorite")
      .eq("is_active", true)
      .order("is_favorite", { ascending: false })
      .order("name"),
    supabaseAdmin.from("email_signatures").select("id, name, content, is_default").eq("user_id", admin.id).order("is_default", { ascending: false }),
    supabaseAdmin
      .from("email_logs")
      .select("template_id")
      .eq("sender_id", admin.id)
      .not("template_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const recentTemplateIds: string[] = [];
  for (const log of recentLogs ?? []) {
    if (log.template_id && !recentTemplateIds.includes(log.template_id)) recentTemplateIds.push(log.template_id);
    if (recentTemplateIds.length >= 5) break;
  }

  return {
    lead: lead ? { id: lead.id, name: lead.name, email: lead.email, title: lead.title, company: lead.company } : null,
    variableValues,
    templates: (templates ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      subject: t.subject,
      bodyHtml: t.body_html,
      isFavorite: t.is_favorite,
    })),
    signatures: (signatures ?? []).map((s) => ({ id: s.id, name: s.name, content: s.content, isDefault: s.is_default })),
    recentTemplateIds,
  };
}

// Returns { error } instead of throwing — Next.js 16 redacts thrown Server
// Action error messages in production (see convertQuoteToInvoice's comment,
// src/app/admin/quotes/actions.ts), and here in particular the caller needs
// the REAL message ("Le lead ne possède pas d'adresse email valide.") not a
// generic redaction.
export async function sendEmailToLead(input: {
  leadId: string;
  templateId: string | null;
  subject: string;
  bodyHtml: string;
  bodyText: string;
}): Promise<{ error: string | null; emailLogId?: string }> {
  const admin = await requireAdmin();
  const result = await sendLeadEmail({ ...input, senderId: admin.id });

  if (!result.error) {
    revalidatePath(`/admin/leads/${input.leadId}`);
    revalidatePath("/admin/emails");
  }
  return result;
}

export async function saveEmailDraft(input: {
  id?: string;
  leadId: string;
  templateId: string | null;
  subject: string;
  bodyHtml: string;
  bodyText: string;
}): Promise<{ error: string | null; id?: string }> {
  const admin = await requireAdmin();

  const { data: lead } = await supabaseAdmin.from("leads").select("email").eq("id", input.leadId).maybeSingle();
  if (!lead) return { error: "Lead introuvable." };

  if (input.id) {
    const { error } = await supabaseAdmin
      .from("email_logs")
      .update({
        template_id: input.templateId,
        subject: input.subject,
        body: input.bodyHtml,
        body_text: input.bodyText,
      })
      .eq("id", input.id)
      .eq("status", "draft");
    if (error) return { error: "L'enregistrement du brouillon a échoué." };
    revalidatePath("/admin/emails");
    return { error: null, id: input.id };
  }

  const { data, error } = await supabaseAdmin
    .from("email_logs")
    .insert({
      lead_id: input.leadId,
      sender_id: admin.id,
      template_id: input.templateId,
      recipient: lead.email,
      subject: input.subject,
      body: input.bodyHtml,
      body_text: input.bodyText,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) return { error: "L'enregistrement du brouillon a échoué." };
  revalidatePath("/admin/emails");
  return { error: null, id: data.id };
}

export async function discardEmailDraft(id: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("email_logs").delete().eq("id", id).eq("status", "draft");
  if (error) return { error: "La suppression du brouillon a échoué." };
  revalidatePath("/admin/emails");
  return { error: null };
}

export interface LeadEmailHistoryItem {
  id: string;
  subject: string;
  status: string;
  templateName: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  failedAt: string | null;
  createdAt: string;
}

export async function getLeadEmailHistory(leadId: string): Promise<LeadEmailHistoryItem[]> {
  await requireAdmin();

  const { data } = await supabaseAdmin
    .from("email_logs")
    .select("id, subject, status, template_id, sent_at, delivered_at, opened_at, clicked_at, failed_at, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const templateIds = Array.from(new Set(rows.map((r) => r.template_id).filter((id): id is string => !!id)));
  let templateNames = new Map<string, string>();
  if (templateIds.length > 0) {
    const { data: templates } = await supabaseAdmin.from("email_templates").select("id, name").in("id", templateIds);
    templateNames = new Map((templates ?? []).map((t) => [t.id, t.name]));
  }

  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    status: r.status,
    templateName: r.template_id ? (templateNames.get(r.template_id) ?? null) : null,
    sentAt: r.sent_at,
    deliveredAt: r.delivered_at,
    openedAt: r.opened_at,
    clickedAt: r.clicked_at,
    failedAt: r.failed_at,
    createdAt: r.created_at,
  }));
}

export interface EmailLogDetail {
  id: string;
  recipient: string;
  senderName: string | null;
  subject: string;
  bodyHtml: string;
  status: string;
  statusLabel: string;
  templateName: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  failedAt: string | null;
}

export async function getEmailLogDetail(id: string): Promise<EmailLogDetail | null> {
  await requireAdmin();

  const { data: log } = await supabaseAdmin.from("email_logs").select("*").eq("id", id).maybeSingle();
  if (!log) return null;

  const [{ data: sender }, { data: template }] = await Promise.all([
    log.sender_id ? supabaseAdmin.from("profiles").select("full_name, email").eq("id", log.sender_id).maybeSingle() : Promise.resolve({ data: null }),
    log.template_id ? supabaseAdmin.from("email_templates").select("name").eq("id", log.template_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const status: string = log.status;

  return {
    id: log.id,
    recipient: log.recipient,
    senderName: sender?.full_name ?? sender?.email ?? null,
    subject: log.subject,
    bodyHtml: log.body,
    status,
    statusLabel: isEmailStatus(status) ? EMAIL_STATUS_LABELS[status] : status,
    templateName: template?.name ?? null,
    createdAt: log.created_at,
    sentAt: log.sent_at,
    deliveredAt: log.delivered_at,
    openedAt: log.opened_at,
    clickedAt: log.clicked_at,
    failedAt: log.failed_at,
  };
}
