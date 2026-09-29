"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity, getActorDisplayName, notifyAdminsOfClientMessage } from "@/lib/activity";
import {
  attachFilesToMessage,
  readAttachmentFiles,
  restoreMessage,
  setThreadTrashed,
  softDeleteMessage,
  toggleMessageReaction,
  type MessagingActor,
} from "@/lib/messaging/mutations";

export async function createRequestThread(formData: FormData) {
  const user = await requireUser();

  const subject = formData.get("subject");
  const body = formData.get("body");
  const projectId = formData.get("project_id");

  if (typeof subject !== "string" || !subject.trim()) throw new Error("Sujet requis.");
  if (typeof body !== "string" || !body.trim()) throw new Error("Message requis.");

  const projectIdValue = typeof projectId === "string" && projectId ? projectId : null;

  const { data: thread, error: threadError } = await supabaseAdmin
    .from("request_threads")
    .insert({
      client_id: user.id,
      project_id: projectIdValue,
      subject: subject.trim(),
    })
    .select("id")
    .single();

  if (threadError || !thread) throw new Error("La création de la demande a échoué.");

  const { error: messageError } = await supabaseAdmin.from("request_messages").insert({
    thread_id: thread.id,
    client_id: user.id,
    body: body.trim(),
    created_by: "client",
  });

  if (messageError) throw new Error("L'envoi du message a échoué.");

  const actorName = await getActorDisplayName(user.id);

  await logActivity({
    clientId: user.id,
    projectId: projectIdValue,
    type: "message",
    title: "Nouvelle demande envoyée",
    adminTitle: `${actorName} a envoyé une nouvelle demande « ${subject.trim()} »`,
    actorId: user.id,
    description: subject.trim(),
  });
  await notifyAdminsOfClientMessage({ clientId: user.id, clientDisplayName: actorName, subject: subject.trim() });

  revalidatePath("/client");
  revalidatePath("/client/requests");
}

export async function replyToOwnThread(threadId: string, formData: FormData) {
  const user = await requireUser();

  const body = formData.get("body");
  const files = readAttachmentFiles(formData);
  // Un message peut n'être QUE des fichiers : obliger à écrire un mot pour
  // envoyer un plan serait une formalité sans objet.
  if ((typeof body !== "string" || !body.trim()) && files.length === 0) throw new Error("Message vide.");
  const text = typeof body === "string" ? body.trim() : "";

  const replyToId = formData.get("reply_to_id");
  const replyTo = typeof replyToId === "string" && replyToId ? replyToId : null;

  const { data: thread } = await supabaseAdmin
    .from("request_threads")
    .select("client_id, project_id, subject, status")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread || thread.client_id !== user.id) throw new Error("Accès refusé.");

  const { data: inserted, error } = await supabaseAdmin
    .from("request_messages")
    .insert({
      thread_id: threadId,
      client_id: user.id,
      body: text,
      created_by: "client",
      ...(replyTo ? { reply_to_id: replyTo } : {}),
    })
    .select("id")
    .single();
  if (error || !inserted) throw new Error("L'envoi a échoué.");

  if (files.length) {
    const { error: attachError } = await attachFilesToMessage({
      messageId: inserted.id,
      clientId: user.id,
      projectId: thread.project_id,
      files,
      uploaderId: user.id,
    });
    // Le message est déjà parti : un fichier refusé ne doit pas le faire
    // disparaître. On le dit, on ne l'annule pas.
    if (attachError) throw new Error(`Message envoyé, mais un fichier n'est pas passé : ${attachError}`);
  }

  // Any client reply — including to a closed thread — puts it back in front
  // of the team, mirroring how admin's own reply flips it to "answered".
  await supabaseAdmin
    .from("request_threads")
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", threadId);

  const actorName = await getActorDisplayName(user.id);
  await logActivity({
    clientId: user.id,
    projectId: thread.project_id,
    type: "message",
    title: "Message envoyé",
    adminTitle: `${actorName} a répondu dans la demande « ${thread.subject} »`,
    actorId: user.id,
  });
  await notifyAdminsOfClientMessage({ clientId: user.id, clientDisplayName: actorName, subject: thread.subject });

  revalidatePath("/client/requests");
  revalidatePath(`/client/requests/${threadId}`);
}

// ── Réagir, supprimer, ranger ────────────────────────────────────────
//
// Les règles vivent dans lib/messaging/mutations : les deux côtés les
// partagent, donc ni l'un ni l'autre ne peut s'en écarter tout seul. Ici,
// il ne reste que l'identité de l'appelant et la revalidation.

async function clientActor(): Promise<MessagingActor> {
  const user = await requireUser();
  return { id: user.id, kind: "client" };
}

export async function reactToMessage(threadId: string, messageId: string, emoji: string) {
  const actor = await clientActor();
  const result = await toggleMessageReaction(messageId, emoji, actor);
  if (!result.error) revalidatePath(`/client/requests/${threadId}`);
  return result;
}

export async function deleteMyMessage(threadId: string, messageId: string) {
  const actor = await clientActor();
  const result = await softDeleteMessage(messageId, actor);
  if (!result.error) {
    revalidatePath("/client/requests");
    revalidatePath(`/client/requests/${threadId}`);
  }
  return result;
}

export async function restoreMyMessage(threadId: string, messageId: string) {
  const actor = await clientActor();
  const result = await restoreMessage(messageId, actor);
  if (!result.error) {
    revalidatePath("/client/requests");
    revalidatePath(`/client/requests/${threadId}`);
  }
  return result;
}

export async function trashMyThread(threadId: string) {
  const actor = await clientActor();
  const result = await setThreadTrashed(threadId, actor, true);
  if (!result.error) {
    revalidatePath("/client");
    revalidatePath("/client/requests");
  }
  return result;
}

export async function restoreMyThread(threadId: string) {
  const actor = await clientActor();
  const result = await setThreadTrashed(threadId, actor, false);
  if (!result.error) {
    revalidatePath("/client");
    revalidatePath("/client/requests");
  }
  return result;
}
