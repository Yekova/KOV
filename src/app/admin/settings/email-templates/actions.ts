"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isEmailTemplateCategory } from "@/lib/admin/status";
import { extractVariableKeys } from "@/lib/email/variables";

export interface EmailTemplateRow {
  id: string;
  name: string;
  category: string;
  subject: string;
  bodyHtml: string;
  description: string | null;
  variables: string[];
  isActive: boolean;
  isFavorite: boolean;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getEmailTemplatesAdmin(): Promise<EmailTemplateRow[]> {
  await requireAdmin();

  const { data } = await supabaseAdmin
    .from("email_templates")
    .select("id, name, category, subject, body_html, description, variables, is_active, is_favorite, created_by, updated_by, created_at, updated_at")
    .order("category")
    .order("name");

  const rows = data ?? [];
  const authorIds = Array.from(new Set(rows.flatMap((r) => [r.created_by, r.updated_by]).filter((id): id is string => !!id)));
  let names = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name, email").in("id", authorIds);
    names = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.email]));
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    subject: r.subject,
    bodyHtml: r.body_html,
    description: r.description,
    variables: r.variables ?? [],
    isActive: r.is_active,
    isFavorite: r.is_favorite,
    createdByName: r.created_by ? (names.get(r.created_by) ?? null) : null,
    updatedByName: r.updated_by ? (names.get(r.updated_by) ?? null) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

interface TemplateFormInput {
  name: string;
  category: string;
  description: string;
  subject: string;
  bodyHtml: string;
}

function parseTemplateForm(formData: FormData): { data: TemplateFormInput | null; error: string | null } {
  const name = formData.get("name");
  const category = formData.get("category");
  const description = formData.get("description");
  const subject = formData.get("subject");
  const bodyHtml = formData.get("body_html");

  if (typeof name !== "string" || !name.trim()) return { data: null, error: "Nom du modèle requis." };
  if (typeof category !== "string" || !isEmailTemplateCategory(category)) return { data: null, error: "Catégorie invalide." };
  if (typeof subject !== "string" || !subject.trim()) return { data: null, error: "Objet requis." };
  if (typeof bodyHtml !== "string" || !bodyHtml.trim() || bodyHtml === "<p></p>") return { data: null, error: "Le corps du message ne peut pas être vide." };

  return {
    data: {
      name: name.trim(),
      category,
      description: typeof description === "string" ? description.trim() : "",
      subject: subject.trim(),
      bodyHtml,
    },
    error: null,
  };
}

// Returns { error } instead of throwing — Next.js 16 redacts thrown Server
// Action error messages in production (see convertQuoteToInvoice's comment,
// src/app/admin/quotes/actions.ts).
export async function createEmailTemplate(formData: FormData): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  const { data, error: parseError } = parseTemplateForm(formData);
  if (!data) return { error: parseError };

  const { error } = await supabaseAdmin.from("email_templates").insert({
    name: data.name,
    category: data.category,
    description: data.description || null,
    subject: data.subject,
    body_html: data.bodyHtml,
    // Not a real TipTap document — email_templates.body predates this
    // editor and was scoped for a full ProseMirror AST; body_html is what
    // every reader in this codebase (composer, sender, preview) actually
    // uses, this is just a NOT NULL-satisfying snapshot of the same HTML.
    body: { html: data.bodyHtml },
    variables: extractVariableKeys(`${data.subject} ${data.bodyHtml}`),
    created_by: admin.id,
  });
  if (error) return { error: "La création du modèle a échoué." };

  revalidatePath("/admin/settings/email-templates");
  return { error: null };
}

export async function updateEmailTemplate(id: string, formData: FormData): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  const { data, error: parseError } = parseTemplateForm(formData);
  if (!data) return { error: parseError };

  const { error } = await supabaseAdmin
    .from("email_templates")
    .update({
      name: data.name,
      category: data.category,
      description: data.description || null,
      subject: data.subject,
      body_html: data.bodyHtml,
      body: { html: data.bodyHtml },
      variables: extractVariableKeys(`${data.subject} ${data.bodyHtml}`),
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "La mise à jour du modèle a échoué." };

  revalidatePath("/admin/settings/email-templates");
  return { error: null };
}

export async function duplicateEmailTemplate(id: string): Promise<{ error: string | null }> {
  const admin = await requireAdmin();

  const { data: original } = await supabaseAdmin.from("email_templates").select("*").eq("id", id).maybeSingle();
  if (!original) return { error: "Modèle introuvable." };

  const { error } = await supabaseAdmin.from("email_templates").insert({
    name: `${original.name} — copie`,
    category: original.category,
    description: original.description,
    subject: original.subject,
    body: original.body,
    body_html: original.body_html,
    variables: original.variables,
    is_active: true,
    is_favorite: false,
    created_by: admin.id,
  });
  if (error) return { error: "La duplication a échoué." };

  revalidatePath("/admin/settings/email-templates");
  return { error: null };
}

export async function setEmailTemplateActive(id: string, isActive: boolean): Promise<{ error: string | null }> {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("email_templates").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: "La mise à jour a échoué." };
  revalidatePath("/admin/settings/email-templates");
  return { error: null };
}

export async function toggleEmailTemplateFavorite(id: string, isFavorite: boolean): Promise<{ error: string | null }> {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("email_templates").update({ is_favorite: isFavorite }).eq("id", id);
  if (error) return { error: "La mise à jour a échoué." };
  revalidatePath("/admin/settings/email-templates");
  return { error: null };
}
