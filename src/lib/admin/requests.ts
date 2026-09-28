import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
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

  projectId: string | null;
  projectName: string | null;

  messageCount: number;
  lastMessageAt: string | null;
  lastMessageBy: "client" | "admin" | null;
  lastMessageExcerpt: string | null;

  waitingOn: WaitingOn;
  /** Depuis combien de jours la balle est dans notre camp. Null sinon. */
  waitingDays: number | null;
}

const DAY_MS = 86_400_000;

export async function getRequestThreads(): Promise<RequestThreadSummary[]> {
  const { data: threadRows } = await supabaseAdmin
    .from("request_threads")
    .select("id, client_id, project_id, subject, status, created_at, updated_at")
    .order("updated_at", { ascending: false });

  const threads = threadRows ?? [];
  if (threads.length === 0) return [];

  const threadIds = threads.map((row) => row.id as string);
  const clientIds = Array.from(new Set(threads.map((row) => row.client_id as string)));
  const projectIds = Array.from(
    new Set(threads.map((row) => row.project_id as string | null).filter((id): id is string => Boolean(id)))
  );

  const [{ data: messageRows }, { data: clientRows }, { data: projectRows }] = await Promise.all([
    supabaseAdmin
      .from("request_messages")
      .select("thread_id, body, created_by, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("id, full_name, company, email, avatar_path").in("id", clientIds),
    projectIds.length
      ? supabaseAdmin.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Trié par date décroissante : le premier message vu pour un fil est son
  // dernier. Une seule lecture sert donc à la fois au compte et au dernier.
  const counts = new Map<string, number>();
  const last = new Map<string, { body: string; createdBy: "client" | "admin"; createdAt: string }>();
  for (const row of messageRows ?? []) {
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
    };
  });
}

/** Le nombre de demandes qui attendent une réponse de notre part. */
export async function countRequestsWaitingOnUs(): Promise<number> {
  const threads = await getRequestThreads();
  return threads.filter((thread) => thread.waitingOn === "us").length;
}

export interface RequestMessage {
  id: string;
  body: string;
  createdBy: "client" | "admin";
  createdAt: string;
  authorName: string | null;
}

export interface RequestThreadDetail extends RequestThreadSummary {
  messages: RequestMessage[];
}

export async function getRequestThread(threadId: string): Promise<RequestThreadDetail | null> {
  const threads = await getRequestThreads();
  const summary = threads.find((thread) => thread.id === threadId);
  if (!summary) return null;

  const { data: messageRows } = await supabaseAdmin
    .from("request_messages")
    .select("id, body, created_by, created_at, author_admin_id")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const adminIds = Array.from(
    new Set(
      (messageRows ?? [])
        .map((row) => row.author_admin_id as string | null)
        .filter((id): id is string => Boolean(id))
    )
  );
  const { data: adminRows } = adminIds.length
    ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", adminIds)
    : { data: [] };
  const admins = new Map((adminRows ?? []).map((row) => [row.id as string, (row.full_name as string | null) ?? null]));

  return {
    ...summary,
    messages: (messageRows ?? []).map((row) => ({
      id: row.id as string,
      body: row.body as string,
      createdBy: row.created_by as "client" | "admin",
      createdAt: row.created_at as string,
      authorName:
        row.created_by === "admin"
          ? (admins.get(row.author_admin_id as string) ?? null)
          : summary.clientName,
    })),
  };
}
