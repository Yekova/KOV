import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getThreadMessages, type MyThreadMessage } from "@/lib/portal/requests";
import { getPublicAssetUrl } from "@/lib/portal/storage";

// Les demandes clients, vues côté studio.
//
// Elles existaient déjà des deux côtés : le client écrit depuis son espace,
// l'admin peut répondre — mais seulement depuis la fiche du client concerné.
// Il n'y avait donc aucun endroit d'où voir CE QUI ATTEND une réponse, tous
// clients confondus. Une demande arrivée un vendredi soir n'était visible
// qu'en ouvrant la bonne fiche.
//
// ── LE SEUL CHAMP QUI COMPTE VRAIMENT ────────────────────────────────────
//
// `waitingOn`. Le statut stocké (open / answered / closed) dit ce qui s'est
// passé ; il ne dit pas qui doit jouer. Un fil « answered » dont le client a
// répondu depuis redevient « open », mais un fil « open » que personne n'a
// lu et un fil « open » où le client relance sont deux situations
// différentes.
//
// La règle est simple et se vérifie : si le dernier message vient du client,
// la balle est chez nous. S'il vient de nous, elle est chez lui. Un fil clos
// n'attend personne.

export type WaitingOn = "us" | "client" | "nobody";

export interface RequestThreadSummary {
  id: string;
  subject: string;
  status: "open" | "answered" | "closed";
  createdAt: string;
  updatedAt: string;

  clientId: string;
  clientName: string;
  clientAvatarUrl: string | null;
  /** Présence du client, tenue automatiquement par son espace. */
  clientIsOnline: boolean;

  projectId: string | null;
  projectName: string | null;

  messageCount: number;
  lastMessageAt: string | null;
  lastMessageBy: "client" | "admin" | null;
  lastMessageExcerpt: string | null;

  waitingOn: WaitingOn;
  /** Depuis combien de jours la balle est dans notre camp. Null sinon. */
  waitingDays: number | null;
  /** Quand LE STUDIO l'a mise à la corbeille. Null tant qu'elle est dans
   *  la liste — la suppression est personnelle, donc la date l'est aussi. */
  deletedAt: string | null;
}

const DAY_MS = 86_400_000;

/**
 * Les conversations du studio.
 *
 * `trashed` bascule entre la liste et « Supprimés récemment ». La
 * suppression est PERSONNELLE : elle pose deleted_by_admin_at, et la
 * conversation reste entière dans l'espace du client.
 *
 * Le filtre est appliqué en mémoire et non par .is() : la colonne naît
 * avec la migration 20260929140000, et une clause sur une colonne absente
 * ferait échouer la requête — donc toute la messagerie.
 */
export async function getRequestThreads(
  { trashed = false }: { trashed?: boolean } = {}
): Promise<RequestThreadSummary[]> {
  const { data: threadRows } = await supabaseAdmin
    .from("request_threads")
    .select("*")
    .order("updated_at", { ascending: false });

  const threads = (threadRows ?? []).filter((row) => {
    const deletedAt = (row as { deleted_by_admin_at?: string | null }).deleted_by_admin_at ?? null;
    return trashed ? Boolean(deletedAt) : !deletedAt;
  });
  if (threads.length === 0) return [];

  const threadIds = threads.map((row) => row.id as string);
  const clientIds = Array.from(new Set(threads.map((row) => row.client_id as string)));
  const projectIds = Array.from(
    new Set(threads.map((row) => row.project_id as string | null).filter((id): id is string => Boolean(id)))
  );

  const [{ data: messageRows }, { data: clientRows }, { data: projectRows }] = await Promise.all([
    supabaseAdmin
      // « * » : deleted_at naît avec la migration 20260929140000.
      .from("request_messages")
      .select("*")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("id, full_name, company, email, avatar_path, is_online").in("id", clientIds),
    projectIds.length
      ? supabaseAdmin.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Trié par date décroissante : le premier message vu pour un fil est son
  // dernier. Une seule lecture sert donc à la fois au compte et au dernier.
  const counts = new Map<string, number>();
  const last = new Map<string, { body: string; createdBy: "client" | "admin"; createdAt: string }>();
  for (const row of messageRows ?? []) {
    // Un message supprimé ne compte pas et ne sert pas d'extrait.
    if ((row as { deleted_at?: string | null }).deleted_at) continue;

    const threadId = row.thread_id as string;
    counts.set(threadId, (counts.get(threadId) ?? 0) + 1);
    if (!last.has(threadId)) {
      last.set(threadId, {
        body: row.body as string,
        createdBy: row.created_by as "client" | "admin",
        createdAt: row.created_at as string,
      });
    }
  }

  const clients = new Map(
    (clientRows ?? []).map((row) => [
      row.id as string,
      {
        name:
          (row.company as string | null)?.trim() ||
          (row.full_name as string | null)?.trim() ||
          (row.email as string | null) ||
          "Client sans nom",
        avatarUrl: getPublicAssetUrl(row.avatar_path as string | null),
        isOnline: Boolean(row.is_online),
      },
    ])
  );
  const projects = new Map((projectRows ?? []).map((row) => [row.id as string, row.name as string]));

  const now = Date.now();

  return threads.map((row) => {
    const id = row.id as string;
    const status = row.status as RequestThreadSummary["status"];
    const lastMessage = last.get(id) ?? null;
    const client = clients.get(row.client_id as string);

    const waitingOn: WaitingOn =
      status === "closed" ? "nobody" : lastMessage?.createdBy === "admin" ? "client" : "us";

    return {
      id,
      subject: row.subject as string,
      status,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,

      clientId: row.client_id as string,
      clientName: client?.name ?? "Client sans nom",
      clientAvatarUrl: client?.avatarUrl ?? null,
      clientIsOnline: client?.isOnline ?? false,

      projectId: (row.project_id as string | null) ?? null,
      projectName: row.project_id ? (projects.get(row.project_id as string) ?? null) : null,

      messageCount: counts.get(id) ?? 0,
      lastMessageAt: lastMessage?.createdAt ?? null,
      lastMessageBy: lastMessage?.createdBy ?? null,
      // Un extrait, pas le message entier : la table sert à trier, la
      // lecture se fait sur le fil.
      lastMessageExcerpt: lastMessage ? lastMessage.body.replace(/\s+/g, " ").trim().slice(0, 120) : null,

      waitingOn,
      waitingDays:
        waitingOn === "us" && lastMessage
          ? Math.floor((now - new Date(lastMessage.createdAt).getTime()) / DAY_MS)
          : null,
      deletedAt: (row as { deleted_by_admin_at?: string | null }).deleted_by_admin_at ?? null,
    };
  });
}

/** Le nombre de demandes qui attendent une réponse de notre part. */
export async function countRequestsWaitingOnUs(): Promise<number> {
  const threads = await getRequestThreads();
  return threads.filter((thread) => thread.waitingOn === "us").length;
}

// Le message du studio est le MÊME objet que celui du client.
//
// Les deux côtés avaient chacun leur chargeur et leur type. Avec les
// réponses citées, les réactions, les pièces jointes et la suppression,
// deux implémentations garantissaient que les deux écrans finiraient par
// ne plus montrer la même conversation. Le type est donc réexporté et le
// chargement passe par la fonction partagée.
export type RequestMessage = MyThreadMessage;

export interface RequestThreadDetail extends RequestThreadSummary {
  messages: RequestMessage[];
}

/** Le détail d'un fil. `adminId` est celui qui regarde : il décide de
 *  « mes » réactions et de ce que ce compte peut supprimer. */
export async function getRequestThread(threadId: string, adminId: string): Promise<RequestThreadDetail | null> {
  const threads = await getRequestThreads();
  const summary = threads.find((thread) => thread.id === threadId);
  if (!summary) return null;

  return {
    ...summary,
    messages: await getThreadMessages(threadId, summary.clientId, { id: adminId, kind: "admin" }),
  };
}
