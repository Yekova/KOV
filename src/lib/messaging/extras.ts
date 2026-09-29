import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrls } from "@/lib/portal/storage";
import { KOV_REACTIONS, isKovReaction, type KovReaction } from "@/lib/messaging/reactions";

// Ce qui s'accroche à un message : les réactions et les pièces jointes.
//
// Écrit une fois pour les deux côtés. Le studio et le client voient
// exactement les mêmes réactions et les mêmes fichiers — seul « la
// mienne » change, et c'est le seul argument que cette fonction prend en
// plus des identifiants.
//
// Les six réactions sont dans lib/messaging/reactions : ce fichier est
// server-only, et la rangée qui les affiche est rendue côté client.
export { KOV_REACTIONS, isKovReaction, type KovReaction } from "@/lib/messaging/reactions";

export interface MessageReactionSummary {
  emoji: KovReaction;
  count: number;
  /** Vrai quand celui qui regarde a posé celle-ci — le clic la retire. */
  mine: boolean;
  /** Qui a réagi, pour l'infobulle. Jamais plus de quelques noms. */
  names: string[];
}

export interface MessageAttachmentView {
  id: string;
  documentId: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  /** Lien signé, valable une heure. Null si la signature a échoué. */
  url: string | null;
}

export interface MessageExtras {
  reactions: MessageReactionSummary[];
  attachments: MessageAttachmentView[];
}

const EMPTY: MessageExtras = { reactions: [], attachments: [] };

/**
 * Les réactions et pièces jointes d'un lot de messages, en deux requêtes.
 *
 * `viewerId` est le profil de celui qui regarde : le client pour le
 * portail, l'admin connecté pour le studio. C'est lui qui décide de
 * `mine`.
 *
 * ── POURQUOI L'ERREUR EST AVALÉE ─────────────────────────────────────
 *
 * Les deux tables sont nées avec la migration 20260929140000, appliquée le
 * 29 septembre 2026 (4 colonnes, 2 tables, 2 policies, 4 index — vérifiés
 * après coup, 14 messages et 3 fils intacts). La tolérance ne sert donc
 * plus à attendre la migration.
 *
 * Elle reste, pour une autre raison : faire tomber un fil de conversation
 * entier parce qu'une lecture de RÉACTIONS a échoué serait une régression
 * bien pire que l'absence des réactions. Le message est ce qui compte ;
 * ce qui s'y accroche est secondaire, et doit échouer comme tel.
 */
export async function getMessageExtras(
  messageIds: string[],
  viewerId: string
): Promise<Map<string, MessageExtras>> {
  const result = new Map<string, MessageExtras>();
  if (messageIds.length === 0) return result;

  const [reactionsQuery, attachmentsQuery] = await Promise.all([
    supabaseAdmin
      .from("request_message_reactions")
      .select("message_id, emoji, reactor_id")
      .in("message_id", messageIds),
    supabaseAdmin
      .from("request_message_attachments")
      .select("id, message_id, document_id, documents(filename, storage_path, mime_type, size_bytes)")
      .in("message_id", messageIds),
  ]);

  // ── Réactions ──────────────────────────────────────────────────────

  const reactionRows = reactionsQuery.error ? [] : (reactionsQuery.data ?? []);

  // Les noms viennent d'une seule requête sur les profils concernés, pas
  // d'une par réaction.
  const reactorIds = Array.from(new Set(reactionRows.map((row) => row.reactor_id as string)));
  const names = new Map<string, string>();
  if (reactorIds.length) {
    const { data: profileRows } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, company, email")
      .in("id", reactorIds);
    for (const row of profileRows ?? []) {
      names.set(row.id, row.full_name?.trim() || row.company?.trim() || row.email || "Quelqu'un");
    }
  }

  const byMessage = new Map<string, Map<KovReaction, MessageReactionSummary>>();
  for (const row of reactionRows) {
    const emoji = row.emoji as string;
    if (!isKovReaction(emoji)) continue;

    const messageId = row.message_id as string;
    let group = byMessage.get(messageId);
    if (!group) {
      group = new Map();
      byMessage.set(messageId, group);
    }

    const current = group.get(emoji) ?? { emoji, count: 0, mine: false, names: [] };
    current.count += 1;
    if (row.reactor_id === viewerId) current.mine = true;
    const name = names.get(row.reactor_id as string);
    if (name) current.names.push(name);
    group.set(emoji, current);
  }

  // ── Pièces jointes ─────────────────────────────────────────────────

  type AttachmentRow = {
    id: string;
    message_id: string;
    document_id: string;
    documents: { filename: string; storage_path: string; mime_type: string | null; size_bytes: number | null } | null;
  };

  const attachmentRows = (attachmentsQuery.error ? [] : (attachmentsQuery.data ?? [])) as unknown as AttachmentRow[];

  // Toutes les URL sont signées en UN appel : une signature par vignette
  // était exactement le N+1 déjà corrigé sur les trois pages de documents.
  const paths = attachmentRows.map((row) => row.documents?.storage_path).filter((p): p is string => Boolean(p));
  const signed = paths.length ? await createSignedDownloadUrls(paths, 3600) : new Map<string, string>();

  for (const row of attachmentRows) {
    const document = row.documents;
    if (!document) continue;

    const entry = result.get(row.message_id) ?? { reactions: [], attachments: [] };
    entry.attachments.push({
      id: row.id,
      documentId: row.document_id,
      filename: document.filename,
      mimeType: document.mime_type,
      sizeBytes: document.size_bytes,
      url: signed.get(document.storage_path) ?? null,
    });
    result.set(row.message_id, entry);
  }

  // ── Fusion ─────────────────────────────────────────────────────────

  for (const [messageId, group] of byMessage) {
    const entry = result.get(messageId) ?? { reactions: [], attachments: [] };
    // Ordonnées comme KOV_REACTIONS et non par nombre : une rangée dont
    // les emoji changent de place à chaque clic est impossible à viser.
    entry.reactions = KOV_REACTIONS.map((emoji) => group.get(emoji)).filter(
      (item): item is MessageReactionSummary => Boolean(item)
    );
    result.set(messageId, entry);
  }

  return result;
}

export function emptyExtras(): MessageExtras {
  return EMPTY;
}
