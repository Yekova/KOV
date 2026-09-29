import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadClientFile } from "@/lib/portal/storage";
import { isKovReaction } from "@/lib/messaging/extras";

// Les écritures de la messagerie, pour les deux côtés.
//
// Les règles d'autorisation sont ici et nulle part ailleurs : une action
// serveur du portail et une action serveur de l'admin qui les
// réimplémenteraient chacune finiraient par diverger, et c'est du côté le
// moins relu que le trou s'ouvrirait.
//
// ── TOUT EST RENVOYÉ, RIEN N'EST LEVÉ ────────────────────────────────
//
// Une exception qui traverse une action serveur perd son message : React
// la remplace par l'erreur #441, « the specific message is omitted ».
// C'est exactement ce qui avait rendu la conversion d'un lead
// indiagnosticable. Les erreurs sont donc des données.

export interface MessagingActor {
  id: string;
  kind: "client" | "admin";
}

/** Combien de jours une conversation reste dans « Supprimés récemment ». */
export const TRASH_RETENTION_DAYS = 30;

/** Au plus par message. Au-delà, ce n'est plus une pièce jointe, c'est un
 *  dépôt de fichiers — et la page Documents est faite pour ça. */
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

type ThreadRow = { id: string; client_id: string; project_id: string | null; subject: string };

/** Charge le fil et vérifie que l'acteur a le droit d'y toucher.
 *  Un admin a accès à tous les fils ; un client, au sien seulement. */
async function loadThreadFor(threadId: string, actor: MessagingActor): Promise<ThreadRow | null> {
  const { data } = await supabaseAdmin
    .from("request_threads")
    .select("id, client_id, project_id, subject")
    .eq("id", threadId)
    .maybeSingle();
  if (!data) return null;
  if (actor.kind === "client" && data.client_id !== actor.id) return null;
  return data as ThreadRow;
}

async function loadMessageFor(messageId: string, actor: MessagingActor) {
  const { data } = await supabaseAdmin
    .from("request_messages")
    .select("*")
    .eq("id", messageId)
    .maybeSingle();
  if (!data) return null;

  const row = data as {
    id: string;
    thread_id: string;
    client_id: string;
    created_by: "client" | "admin";
    author_admin_id: string | null;
    deleted_at?: string | null;
  };
  if (actor.kind === "client" && row.client_id !== actor.id) return null;
  return row;
}

// ── Réactions ────────────────────────────────────────────────────────

/** Pose la réaction, ou la retire si elle y est déjà. Un seul geste pour
 *  les deux sens : c'est ce que fait le clic dans toutes les messageries,
 *  et un bouton « retirer » séparé doublerait la rangée. */
export async function toggleMessageReaction(
  messageId: string,
  emoji: string,
  actor: MessagingActor
): Promise<{ error?: string }> {
  if (!isKovReaction(emoji)) return { error: "Réaction inconnue." };

  const message = await loadMessageFor(messageId, actor);
  if (!message) return { error: "Message introuvable." };
  if (message.deleted_at) return { error: "Ce message a été supprimé." };

  const { data: existing } = await supabaseAdmin
    .from("request_message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("reactor_id", actor.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin.from("request_message_reactions").delete().eq("id", existing.id);
    return error ? { error: "Le retrait de la réaction a échoué." } : {};
  }

  const { error } = await supabaseAdmin.from("request_message_reactions").insert({
    message_id: messageId,
    client_id: message.client_id,
    emoji,
    reactor_kind: actor.kind,
    reactor_id: actor.id,
  });
  // 23505 = doublon : deux clics partis en même temps. La réaction est
  // déjà posée, ce qui est le résultat voulu — ce n'est pas une erreur.
  if (error && error.code !== "23505") return { error: "La réaction n'a pas pu être posée." };
  return {};
}

// ── Suppression d'un message ─────────────────────────────────────────

/** Supprime un message. Son auteur seul, et le corps reste en base pour
 *  pouvoir être restauré — il n'est simplement plus transmis à personne
 *  (voir getThreadMessages). */
export async function softDeleteMessage(messageId: string, actor: MessagingActor): Promise<{ error?: string }> {
  const message = await loadMessageFor(messageId, actor);
  if (!message) return { error: "Message introuvable." };

  const isAuthor =
    actor.kind === "admin" ? message.author_admin_id === actor.id : message.created_by === "client";
  if (!isAuthor) return { error: "Seul l'auteur d'un message peut le supprimer." };
  if (message.deleted_at) return {};

  const { error } = await supabaseAdmin
    .from("request_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)
    // Garde d'idempotence : un second envoi ne déplace pas l'horodatage.
    .is("deleted_at", null);

  return error ? { error: "La suppression a échoué." } : {};
}

export async function restoreMessage(messageId: string, actor: MessagingActor): Promise<{ error?: string }> {
  const message = await loadMessageFor(messageId, actor);
  if (!message) return { error: "Message introuvable." };

  const isAuthor =
    actor.kind === "admin" ? message.author_admin_id === actor.id : message.created_by === "client";
  if (!isAuthor) return { error: "Seul l'auteur d'un message peut le restaurer." };

  const { error } = await supabaseAdmin
    .from("request_messages")
    .update({ deleted_at: null })
    .eq("id", messageId);

  return error ? { error: "La restauration a échoué." } : {};
}

// ── Corbeille des conversations ──────────────────────────────────────

/**
 * Range une conversation dans la corbeille, ou l'en sort.
 *
 * La suppression est PERSONNELLE : elle pose la colonne de son propre
 * côté et ne touche pas à celle d'en face. Le studio ne peut donc pas
 * faire disparaître de l'espace du client un échange que celui-ci a lu —
 * dans une relation commerciale, c'est la propriété qui compte le plus.
 */
export async function setThreadTrashed(
  threadId: string,
  actor: MessagingActor,
  trashed: boolean
): Promise<{ error?: string }> {
  const thread = await loadThreadFor(threadId, actor);
  if (!thread) return { error: "Conversation introuvable." };

  const column = actor.kind === "client" ? "deleted_by_client_at" : "deleted_by_admin_at";
  const { error } = await supabaseAdmin
    .from("request_threads")
    .update({ [column]: trashed ? new Date().toISOString() : null })
    .eq("id", threadId);

  return error ? { error: trashed ? "La suppression a échoué." : "La restauration a échoué." } : {};
}

/**
 * Le ménage de la corbeille, fait à l'ouverture plutôt que par une tâche
 * planifiée — il n'y a pas d'ordonnanceur sur ce projet, et en annoncer
 * un qui n'existe pas serait pire que de balayer ici.
 *
 * Une ligne n'est RÉELLEMENT effacée que lorsque les DEUX côtés l'ont
 * mise à la corbeille depuis plus de trente jours. Tant qu'un seul l'a
 * fait, elle reste en base : l'autre la voit encore, et l'effacer lui
 * retirerait sa conversation sans qu'il ait rien demandé. Elle sort
 * simplement de la corbeille de celui qui l'a supprimée, et reste cachée
 * de sa liste.
 */
export async function purgeExpiredTrash(): Promise<void> {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 86_400_000).toISOString();

  const { data } = await supabaseAdmin
    .from("request_threads")
    .select("*")
    .not("deleted_by_client_at", "is", null)
    .lt("deleted_by_client_at", cutoff);

  const expired = ((data ?? []) as { id: string; deleted_by_admin_at?: string | null }[]).filter(
    (row) => row.deleted_by_admin_at && row.deleted_by_admin_at < cutoff
  );
  if (expired.length === 0) return;

  // Les messages, réactions et pièces jointes partent en cascade (voir la
  // migration). Les documents liés, eux, RESTENT : ils sont dans la page
  // Documents du client, et une conversation rangée ne doit pas emporter
  // un fichier qu'il consulte ailleurs.
  await supabaseAdmin
    .from("request_threads")
    .delete()
    .in(
      "id",
      expired.map((row) => row.id)
    );
}

// ── Pièces jointes ───────────────────────────────────────────────────

/**
 * Attache des fichiers à un message.
 *
 * Chaque fichier devient une ligne `documents` — la table que la page
 * Documents du client lit déjà — plus une ligne de liaison. Un fichier,
 * une seule source de vérité : recopier nom, chemin et taille dans une
 * seconde table produirait deux vérités qui divergent au premier
 * renommage.
 *
 * Renvoie le nombre de fichiers réellement attachés. Un envoi qui échoue
 * ne fait pas échouer le message : le texte est déjà écrit et le perdre
 * pour un fichier trop lourd serait une punition sans rapport.
 */
export async function attachFilesToMessage({
  messageId,
  clientId,
  projectId,
  files,
  uploaderId,
}: {
  messageId: string;
  clientId: string;
  projectId: string | null;
  files: File[];
  uploaderId: string;
}): Promise<{ attached: number; error?: string }> {
  const usable = files.filter((file) => file && file.size > 0).slice(0, MAX_ATTACHMENTS_PER_MESSAGE);
  if (usable.length === 0) return { attached: 0 };

  let attached = 0;
  let firstError: string | undefined;

  for (const file of usable) {
    try {
      const documentId = crypto.randomUUID();
      const storagePath = `${clientId}/messages/${documentId}-${file.name}`;
      await uploadClientFile(storagePath, file);

      const { error: documentError } = await supabaseAdmin.from("documents").insert({
        id: documentId,
        client_id: clientId,
        project_id: projectId,
        filename: file.name,
        storage_path: storagePath,
        mime_type: file.type || null,
        size_bytes: file.size,
        uploaded_by: uploaderId,
        // Visible par le client : une pièce jointe envoyée DANS une
        // conversation qu'il lit ne peut pas être un document interne.
        visibility: "client",
      });
      if (documentError) throw new Error("L'enregistrement du fichier a échoué.");

      const { error: linkError } = await supabaseAdmin.from("request_message_attachments").insert({
        message_id: messageId,
        document_id: documentId,
        client_id: clientId,
      });
      if (linkError) throw new Error("Le rattachement du fichier a échoué.");

      attached += 1;
    } catch (caught) {
      firstError ??= caught instanceof Error ? caught.message : "Le téléversement a échoué.";
    }
  }

  return { attached, error: firstError };
}

/** Les fichiers d'un champ de formulaire, sans les entrées vides que les
 *  navigateurs ajoutent pour un `<input type="file">` laissé intact. */
export function readAttachmentFiles(formData: FormData, field = "attachments"): File[] {
  return formData
    .getAll(field)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}
