"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// La suppression d'un chiffrage.
//
// ── UN CLIC, MAIS RÉVERSIBLE ─────────────────────────────────────────────
//
// Pas de boîte « êtes-vous sûr ». Une confirmation coûte un clic à chaque
// suppression, y compris aux centaines qui étaient voulues, et elle ne
// protège de rien : on répond oui par réflexe. Une annulation, elle, ne
// coûte rien quand tout va bien et sauve exactement le cas qu'on craint.
//
// La suppression rend donc la ligne complète, et restoreConfiguration la
// réinsère avec le MÊME identifiant. Les liens, les versions filles et le
// réel consommé retrouvent leur cible : une restauration qui changerait
// l'identifiant serait une copie, pas une annulation.
//
// ── CE QUI NE SE SUPPRIME PAS ────────────────────────────────────────────
//
// Un chiffrage qui a produit un devis. Ce devis porte un numéro attribué
// par la séquence, il est peut-être parti chez un client, et le chiffrage
// est la seule chose qui explique son prix. Le supprimer laisserait un
// document chiffré que plus personne ne saurait justifier — exactement ce
// que tout ce module existe pour éviter.

export interface DeletedConfiguration {
  row: Record<string, unknown>;
  actuals: Record<string, unknown>[];
}

export async function deleteConfiguration(
  configurationId: string
): Promise<{ error: string | null; deleted?: DeletedConfiguration; title?: string }> {
  await requireAdmin();

  const { data: row } = await supabaseAdmin
    .from("pricing_configurations")
    .select("*")
    .eq("id", configurationId)
    .maybeSingle();

  if (!row) return { error: "Chiffrage introuvable." };
  if (row.quote_id) {
    return {
      error:
        "Ce chiffrage a produit un devis numéroté : il explique son prix et ne se supprime pas. Supprimez d'abord le devis si c'est vraiment ce que vous voulez.",
    };
  }

  // Le réel consommé part en cascade côté base. On le relit AVANT pour
  // pouvoir le rendre : une annulation qui ne restituerait que la moitié
  // des données ne serait pas une annulation.
  const { data: actuals } = await supabaseAdmin
    .from("pricing_actuals")
    .select("*")
    .eq("configuration_id", configurationId);

  const { error } = await supabaseAdmin.from("pricing_configurations").delete().eq("id", configurationId);
  if (error) return { error: "La suppression a échoué." };

  revalidatePath("/admin/pricing");
  return {
    error: null,
    title: (row.title as string) ?? "Chiffrage",
    deleted: { row: row as Record<string, unknown>, actuals: (actuals ?? []) as Record<string, unknown>[] },
  };
}

export async function restoreConfiguration(
  deleted: DeletedConfiguration
): Promise<{ error: string | null; configurationId?: string }> {
  await requireAdmin();

  // La charge utile revient du navigateur. Seul un admin arrive ici et la
  // base fait respecter ses contraintes, mais `quote_id` mérite d'être
  // retiré : un chiffrage supprimable n'en avait pas, et le laisser passer
  // offrirait un moyen de rattacher un devis existant à autre chose.
  const { data, error } = await supabaseAdmin
    .from("pricing_configurations")
    .insert({ ...deleted.row, quote_id: null })
    .select("id")
    .single();

  if (error || !data) return { error: "La restauration a échoué." };

  if (deleted.actuals.length > 0) {
    await supabaseAdmin.from("pricing_actuals").insert(deleted.actuals);
  }

  revalidatePath("/admin/pricing");
  revalidatePath(`/admin/pricing/${data.id as string}`);
  return { error: null, configurationId: data.id as string };
}

// ── Les autres actions d'un chiffrage ────────────────────────────────────
//
// Elles vivaient dans new/actions.ts, à côté de l'enregistrement. Elles
// n'ont rien à voir avec la création : dupliquer, marquer perdu et
// supprimer portent sur un chiffrage qui existe déjà.

/** Duplique un chiffrage en une version suivante, sans toucher à l'original. */
export async function duplicateConfiguration(
  configurationId: string
): Promise<{ error: string | null; configurationId?: string }> {
  const admin = await requireAdmin();

  const { data: source } = await supabaseAdmin
    .from("pricing_configurations")
    .select("settings_version_id, offer_id, client_id, lead_id, title, segment, client_vat_regime, selection, conditions, snapshot, version, parent_id")
    .eq("id", configurationId)
    .maybeSingle();

  if (!source) return { error: "Chiffrage introuvable." };

  // La racine de la lignée, pas le parent immédiat : v3 duplique v2, mais
  // les deux appartiennent à la même famille, et c'est elle qu'on veut
  // pouvoir retrouver d'un coup.
  const rootId = (source.parent_id as string | null) ?? configurationId;

  const { data: siblings } = await supabaseAdmin
    .from("pricing_configurations")
    .select("version")
    .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = ((siblings?.[0]?.version as number | undefined) ?? (source.version as number)) + 1;

  const { data, error } = await supabaseAdmin
    .from("pricing_configurations")
    .insert({
      settings_version_id: source.settings_version_id,
      offer_id: source.offer_id,
      client_id: source.client_id,
      lead_id: source.lead_id,
      title: source.title,
      segment: source.segment,
      client_vat_regime: source.client_vat_regime,
      selection: source.selection,
      conditions: source.conditions,
      snapshot: source.snapshot,
      status: "draft",
      version: nextVersion,
      parent_id: rootId,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "La duplication a échoué." };

  revalidatePath("/admin/pricing");
  return { error: null, configurationId: data.id as string };
}

export async function markConfigurationLost(
  configurationId: string,
  reason: string
): Promise<{ error: string | null }> {
  await requireAdmin();

  if (!reason.trim()) return { error: "Le motif de perte est requis : c'est lui qu'on relira." };

  const { error } = await supabaseAdmin
    .from("pricing_configurations")
    .update({ status: "lost", lost_reason: reason.trim() })
    .eq("id", configurationId);

  if (error) return { error: "L'enregistrement a échoué." };

  revalidatePath("/admin/pricing");
  revalidatePath(`/admin/pricing/${configurationId}`);
  return { error: null };
}
