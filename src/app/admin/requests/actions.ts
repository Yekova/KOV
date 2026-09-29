"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidateClient } from "@/lib/revalidateClient";
import {
  restoreMessage,
  setThreadTrashed,
  softDeleteMessage,
  toggleMessageReaction,
  type MessagingActor,
} from "@/lib/messaging/mutations";

// Clore et rouvrir une demande.
//
// Ces deux actions manquaient. L'admin pouvait répondre — ce qui bascule le
// fil en « answered » — mais rien ne permettait de dire « c'est réglé ». Un
// fil restait donc éternellement dans la file, et la file cessait de vouloir
// dire quelque chose.
//
// ── CLORE N'EST PAS RÉPONDRE ─────────────────────────────────────────────
//
// La clôture ne poste aucun message. Un « nous clôturons votre demande »
// automatique serait une affirmation écrite au nom du studio, sur un sujet
// que personne n'a relu. La règle de ce projet vaut ici comme ailleurs : on
// automatise l'enregistrement, jamais l'affirmation.
//
// Le client, lui, n'est pas enfermé : répondre dans un fil clos le rouvre
// (voir replyToOwnThread côté portail). Clore est donc réversible par les
// deux côtés, ce qui rend le geste sans risque.

const STATUSES = ["open", "answered", "closed"] as const;

export async function setRequestThreadStatus(
  threadId: string,
  status: string
): Promise<{ error: string | null }> {
  await requireAdmin();

  if (!(STATUSES as readonly string[]).includes(status)) {
    return { error: "Statut inconnu." };
  }

  const { data: thread } = await supabaseAdmin
    .from("request_threads")
    .select("client_id, project_id, subject, status")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return { error: "Demande introuvable." };
  if (thread.status === status) return { error: null };

  const { error } = await supabaseAdmin
    .from("request_threads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", threadId);

  if (error) return { error: "Le changement de statut a échoué." };

  // Rien n'est écrit dans activity_log. Ce journal est LU PAR LE CLIENT :
  // son champ `title` s'affiche dans son espace. Clore une demande est un
  // geste de rangement interne, pas un évènement à lui annoncer — et un
  // titre vide lui laisserait une ligne blanche dans son fil.
  //
  // Ce qui reste tracé : le statut lui-même et `updated_at`. Qui a cliqué
  // n'est pas conservé, ce qui est assumé à cette taille d'équipe.

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${threadId}`);
  revalidateClient(thread.client_id as string);
  return { error: null };
}

// Réagir, supprimer, ranger — côté studio.
//
// Le pendant exact des actions du portail. Les règles ne sont écrites ni
// ici ni là-bas mais dans lib/messaging/mutations : deux implémentations
// des mêmes autorisations finiraient par diverger, et c'est du côté le
// moins relu que le trou s'ouvrirait.
//
// La revalidation, elle, ne peut pas être partagée : le studio doit
// rafraîchir SES pages et celles du client, qui n'ont pas les mêmes
// chemins.

async function adminActor(): Promise<MessagingActor> {
  const admin = await requireAdmin();
  return { id: admin.id, kind: "admin" };
}

/** Le client concerné, pour revalider aussi son espace : une réaction
 *  posée par le studio doit apparaître chez lui sans qu'il recharge. */
async function clientIdOfThread(threadId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("request_threads")
    .select("client_id")
    .eq("id", threadId)
    .maybeSingle();
  return (data?.client_id as string | undefined) ?? null;
}

function revalidateBothSides(threadId: string) {
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${threadId}`);
  revalidatePath("/client/requests");
  revalidatePath(`/client/requests/${threadId}`);
}

export async function reactToMessageAsAdmin(threadId: string, messageId: string, emoji: string) {
  const actor = await adminActor();
  const result = await toggleMessageReaction(messageId, emoji, actor);
  if (!result.error) revalidateBothSides(threadId);
  return result;
}

export async function deleteMessageAsAdmin(threadId: string, messageId: string) {
  const actor = await adminActor();
  const result = await softDeleteMessage(messageId, actor);
  if (!result.error) revalidateBothSides(threadId);
  return result;
}

export async function restoreMessageAsAdmin(threadId: string, messageId: string) {
  const actor = await adminActor();
  const result = await restoreMessage(messageId, actor);
  if (!result.error) revalidateBothSides(threadId);
  return result;
}

/** Range la conversation dans la corbeille DU STUDIO. Elle reste entière
 *  dans l'espace du client : la suppression est personnelle, c'est la
 *  décision prise avec le propriétaire et elle est tenue ici. */
export async function trashThreadAsAdmin(threadId: string) {
  const actor = await adminActor();
  const result = await setThreadTrashed(threadId, actor, true);
  if (!result.error) {
    revalidatePath("/admin/requests");
    // La fiche du client liste ses demandes.
    const clientId = await clientIdOfThread(threadId);
    if (clientId) revalidatePath(`/admin/clients/${clientId}`);
  }
  return result;
}

export async function restoreThreadAsAdmin(threadId: string) {
  const actor = await adminActor();
  const result = await setThreadTrashed(threadId, actor, false);
  if (!result.error) {
    revalidatePath("/admin/requests");
    const clientId = await clientIdOfThread(threadId);
    if (clientId) revalidatePath(`/admin/clients/${clientId}`);
  }
  return result;
}
