"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function toStatusKey(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // strip combining accents
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Returns { error } instead of throwing — see convertQuoteToInvoice's
// comment (src/app/admin/quotes/actions.ts) for why: Next.js 16 redacts
// thrown Server Action error messages in production.
export async function createLeadStatus(formData: FormData): Promise<{ error: string | null }> {
  await requireAdmin();

  const label = formData.get("label");
  const color = formData.get("color");
  if (typeof label !== "string" || !label.trim()) return { error: "Nom du statut requis." };
  if (typeof color !== "string" || !color.trim()) return { error: "Couleur requise." };

  const key = toStatusKey(label);
  if (!key) return { error: "Nom du statut invalide." };

  const { count } = await supabaseAdmin.from("lead_statuses").select("key", { count: "exact", head: true });
  const { error } = await supabaseAdmin.from("lead_statuses").insert({
    key,
    label: label.trim(),
    color: color.trim(),
    position: count ?? 0,
  });

  if (error) {
    if (error.code === "23505") return { error: "Un statut avec un nom très proche existe déjà." };
    return { error: "La création du statut a échoué." };
  }

  revalidatePath("/admin/settings/lead-statuses");
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { error: null };
}

export async function updateLeadStatus(key: string, formData: FormData): Promise<{ error: string | null }> {
  await requireAdmin();

  const label = formData.get("label");
  const color = formData.get("color");
  if (typeof label !== "string" || !label.trim()) return { error: "Nom du statut requis." };
  if (typeof color !== "string" || !color.trim()) return { error: "Couleur requise." };

  const { error } = await supabaseAdmin
    .from("lead_statuses")
    .update({ label: label.trim(), color: color.trim(), updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) return { error: "La mise à jour du statut a échoué." };

  revalidatePath("/admin/settings/lead-statuses");
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { error: null };
}

export async function setLeadStatusActive(key: string, isActive: boolean): Promise<{ error: string | null }> {
  await requireAdmin();

  const { data: status } = await supabaseAdmin.from("lead_statuses").select("is_protected").eq("key", key).maybeSingle();
  if (!status) return { error: "Statut introuvable." };
  if (status.is_protected && !isActive) return { error: "Ce statut est protégé et ne peut pas être désactivé." };

  const { error } = await supabaseAdmin
    .from("lead_statuses")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) return { error: "La mise à jour a échoué." };

  revalidatePath("/admin/settings/lead-statuses");
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { error: null };
}

export async function reorderLeadStatuses(orderedKeys: string[]): Promise<{ error: string | null }> {
  await requireAdmin();

  const results = await Promise.all(
    orderedKeys.map((key, index) => supabaseAdmin.from("lead_statuses").update({ position: index }).eq("key", key))
  );

  if (results.some((r) => r.error)) return { error: "Le réordonnancement a échoué." };

  revalidatePath("/admin/settings/lead-statuses");
  revalidatePath("/admin/leads");
  return { error: null };
}
