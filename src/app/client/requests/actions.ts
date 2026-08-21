"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity, getActorDisplayName, notifyAdminsOfClientMessage } from "@/lib/activity";

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
  if (typeof body !== "string" || !body.trim()) throw new Error("Message vide.");

  const { data: thread } = await supabaseAdmin
    .from("request_threads")
    .select("client_id, project_id, subject, status")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread || thread.client_id !== user.id) throw new Error("Accès refusé.");

  const { error } = await supabaseAdmin.from("request_messages").insert({
    thread_id: threadId,
    client_id: user.id,
    body: body.trim(),
    created_by: "client",
  });
  if (error) throw new Error("L'envoi a échoué.");

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
