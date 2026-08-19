"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity, getActorDisplayName } from "@/lib/activity";

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

  revalidatePath("/client");
  revalidatePath("/client/requests");
}
