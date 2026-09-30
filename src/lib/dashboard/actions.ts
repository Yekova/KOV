"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DASHBOARD_SURFACES, type DashboardSurface } from "./blocks";
import {
  matchesDefault,
  parseStoredLayout,
  resolveLayout,
  toStorable,
  type ResolvedBlock,
} from "./layout";

// Lire et écrire l'arrangement du tableau de bord.
//
// La surface arrive du navigateur, donc elle est confrontée à la liste
// fermée : sans ça, une valeur libre s'écrirait dans une colonne
// contrainte et l'insertion échouerait à la figure de l'utilisateur pour
// une raison qu'il ne peut pas comprendre.

function assertSurface(value: string): DashboardSurface {
  if ((DASHBOARD_SURFACES as readonly string[]).includes(value)) return value as DashboardSurface;
  throw new Error("Surface inconnue.");
}

/** Appelée par la page, côté serveur : elle rend déjà l'arrangement
 *  fusionné avec les défauts, prêt à être affiché. */
export async function getDashboardLayout(surface: DashboardSurface): Promise<ResolvedBlock[]> {
  const user = await requireUser();
  const { data } = await supabaseAdmin
    .from("dashboard_preferences")
    .select("blocks")
    .eq("user_id", user.id)
    .eq("surface", surface)
    .maybeSingle();

  return resolveLayout(surface, parseStoredLayout(data?.blocks));
}

export async function saveDashboardLayout(
  surface: string,
  blocks: ResolvedBlock[]
): Promise<{ error?: string }> {
  try {
    const user = await requireUser();
    const target = assertSurface(surface);

    // Un arrangement identique au défaut n'est pas enregistré : la ligne
    // est effacée. Sans ça, on figerait une copie du code, et changer un
    // défaut plus tard ne toucherait plus personne.
    if (matchesDefault(target, blocks)) {
      await supabaseAdmin
        .from("dashboard_preferences")
        .delete()
        .eq("user_id", user.id)
        .eq("surface", target);
    } else {
      await supabaseAdmin.from("dashboard_preferences").upsert(
        {
          user_id: user.id,
          surface: target,
          blocks: toStorable(blocks),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,surface" }
      );
    }

    revalidatePath(target === "admin" ? "/admin" : "/client");
    return {};
  } catch (error) {
    console.error("[dashboard]", error);
    return { error: "L'arrangement n'a pas pu être enregistré." };
  }
}

export async function resetDashboardLayout(surface: string): Promise<{ error?: string }> {
  try {
    const user = await requireUser();
    const target = assertSurface(surface);
    await supabaseAdmin
      .from("dashboard_preferences")
      .delete()
      .eq("user_id", user.id)
      .eq("surface", target);
    revalidatePath(target === "admin" ? "/admin" : "/client");
    return {};
  } catch (error) {
    console.error("[dashboard]", error);
    return { error: "La réinitialisation a échoué." };
  }
}
