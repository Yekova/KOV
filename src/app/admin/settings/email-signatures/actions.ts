"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface SignatureRow {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export async function getMySignatures(): Promise<SignatureRow[]> {
  const admin = await requireAdmin();
  const { data } = await supabaseAdmin
    .from("email_signatures")
    .select("id, name, content, is_default")
    .eq("user_id", admin.id)
    .order("is_default", { ascending: false })
    .order("name");
  return (data ?? []).map((s) => ({ id: s.id, name: s.name, content: s.content, isDefault: s.is_default }));
}

export async function createSignature(formData: FormData): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  const name = formData.get("name");
  const content = formData.get("content");
  if (typeof name !== "string" || !name.trim()) return { error: "Nom de la signature requis." };
  if (typeof content !== "string" || !content.trim() || content === "<p></p>") return { error: "La signature ne peut pas être vide." };

  const { count } = await supabaseAdmin.from("email_signatures").select("id", { count: "exact", head: true }).eq("user_id", admin.id);
  const isFirst = (count ?? 0) === 0;

  const { error } = await supabaseAdmin.from("email_signatures").insert({
    user_id: admin.id,
    name: name.trim(),
    content,
    is_default: isFirst,
  });
  if (error) return { error: "La création a échoué." };

  revalidatePath("/admin/settings/email-signatures");
  return { error: null };
}

export async function updateSignature(id: string, formData: FormData): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  const name = formData.get("name");
  const content = formData.get("content");
  if (typeof name !== "string" || !name.trim()) return { error: "Nom de la signature requis." };
  if (typeof content !== "string" || !content.trim() || content === "<p></p>") return { error: "La signature ne peut pas être vide." };

  const { error } = await supabaseAdmin
    .from("email_signatures")
    .update({ name: name.trim(), content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", admin.id);
  if (error) return { error: "La mise à jour a échoué." };

  revalidatePath("/admin/settings/email-signatures");
  return { error: null };
}

export async function deleteSignature(id: string): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  const { error } = await supabaseAdmin.from("email_signatures").delete().eq("id", id).eq("user_id", admin.id);
  if (error) return { error: "La suppression a échoué." };
  revalidatePath("/admin/settings/email-signatures");
  return { error: null };
}

export async function setDefaultSignature(id: string): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  // Only one is_default = true per user — clear the rest first (small
  // table per admin, a two-step update is simpler and safer than a
  // conditional single query).
  await supabaseAdmin.from("email_signatures").update({ is_default: false }).eq("user_id", admin.id);
  const { error } = await supabaseAdmin.from("email_signatures").update({ is_default: true }).eq("id", id).eq("user_id", admin.id);
  if (error) return { error: "La mise à jour a échoué." };

  revalidatePath("/admin/settings/email-signatures");
  return { error: null };
}
