import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { deriveCurrentPhase, deriveProgress, type ProjectPhase } from "@/lib/portal/progress";
import { deriveRequestWaitingOn, type RequestWaitingOn } from "@/lib/portal/status";

// Les demandes, côté client.
//
// L'admin a déjà les siennes (lib/admin/requests.ts) avec la même règle de
// « qui doit jouer » — dérivée du dernier message, jamais stockée. Ce
// fichier fait la même chose vu de l'autre bord : ici, « nous » c'est le
// client, et ce qui l'intéresse est de savoir si la balle est chez lui.
//
// Les deux côtés ne partagent pas une fonction mais une RÈGLE, tenue dans
// lib/portal/status.ts. Partager la fonction obligerait à faire remonter
// l'identité de l'appelant partout ; partager la règle suffit à garantir
// que les deux écrans ne peuvent pas se contredire.

export interface MyThreadSummary {
  id: string;
  subject: string;
  status: string;
  updatedAt: string;
  projectId: string | null;
  projectName: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  lastMessageBy: "client" | "admin" | null;
  lastMessageExcerpt: string | null;
  waitingOn: RequestWaitingOn;
}

export interface MyThreadMessage {
  id: string;
  body: string;
  createdBy: "client" | "admin";
  createdAt: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
}

export async function getMyRequestThreads(clientId: string): Promise<MyThreadSummary[]> {
  const { data: threadRows } = await supabaseAdmin
    .from("request_threads")
    .select("id, subject, status, updated_at, project_id")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });

  const threads = threadRows ?? [];
  if (threads.length === 0) return [];

  const projectIds = Array.from(
    new Set(threads.map((row) => row.project_id as string | null).filter((id): id is string => Boolean(id)))
  );

  const [{ data: messageRows }, { data: projectRows }] = await Promise.all([
    supabaseAdmin
      .from("request_messages")
      .select("thread_id, body, created_by, created_at")
      .in(
        "thread_id",
        threads.map((row) => row.id)
      )
      .order("created_at", { ascending: false })
      // Borné : en ordre décroissant, les 400 derniers couvrent tous les
      // fils actifs. Au pire, un fil très ancien perd son extrait.
      .limit(400),
    projectIds.length
      ? supabaseAdmin.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

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

  const projects = new Map((projectRows ?? []).map((row) => [row.id, row.name]));

  return threads.map((row) => {
    const lastMessage = last.get(row.id) ?? null;
    return {
      id: row.id,
      subject: row.subject,
      status: row.status,
      updatedAt: row.updated_at,
      projectId: row.project_id,
      projectName: row.project_id ? (projects.get(row.project_id) ?? null) : null,
      messageCount: counts.get(row.id) ?? 0,
      lastMessageAt: lastMessage?.createdAt ?? null,
      lastMessageBy: lastMessage?.createdBy ?? null,
      lastMessageExcerpt: lastMessage ? lastMessage.body.replace(/\s+/g, " ").trim().slice(0, 120) : null,
      waitingOn: deriveRequestWaitingOn(row.status, lastMessage?.createdBy),
    };
  });
}

/** Les messages d'un fil, avec leur auteur. Rend null si le fil n'est pas
 *  celui de ce client — l'appelant n'a donc pas à refaire le contrôle. */
export async function getMyRequestThread(
  clientId: string,
  threadId: string
): Promise<{ summary: MyThreadSummary; messages: MyThreadMessage[] } | null> {
  const { data: thread } = await supabaseAdmin
    .from("request_threads")
    .select("id, client_id")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread || thread.client_id !== clientId) return null;

  const threads = await getMyRequestThreads(clientId);
  const summary = threads.find((row) => row.id === threadId);
  if (!summary) return null;

  return { summary, messages: await getThreadMessages(threadId, clientId) };
}

// Les messages et leurs auteurs, pour les deux côtés.
//
// Les portraits comptent ici : un fil de conversation sans visage se lit
// comme un journal, pas comme un échange. Le client est identifié par
// `clientId`, tout le reste vient de author_admin_id.
export async function getThreadMessages(threadId: string, clientId: string): Promise<MyThreadMessage[]> {
  const { data: messageRows } = await supabaseAdmin
    .from("request_messages")
    .select("id, body, created_by, created_at, author_admin_id")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const rows = messageRows ?? [];
  const peopleIds = Array.from(
    new Set([
      clientId,
      ...rows.map((row) => row.author_admin_id as string | null).filter((id): id is string => Boolean(id)),
    ])
  );

  const { data: profileRows } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, company, email, avatar_path, display_title")
    .in("id", peopleIds);

  const people = new Map(
    (profileRows ?? []).map((row) => [
      row.id,
      {
        name: row.full_name?.trim() || row.company?.trim() || row.email || null,
        avatarUrl: getPublicAssetUrl(row.avatar_path),
      },
    ])
  );

  return rows.map((row) => {
    const author = row.created_by === "admin" ? (row.author_admin_id ? people.get(row.author_admin_id) : null) : people.get(clientId);
    return {
      id: row.id,
      body: row.body,
      createdBy: row.created_by as "client" | "admin",
      createdAt: row.created_at,
      // « Équipe KOV » plutôt que rien : un message du studio écrit par une
      // action automatique n'a pas d'auteur nommé, et « — » ferait croire
      // à une donnée manquante plutôt qu'à un envoi collectif.
      authorName: author?.name ?? (row.created_by === "admin" ? "Équipe KOV" : null),
      authorAvatarUrl: author?.avatarUrl ?? null,
    };
  });
}

export interface ThreadParticipant {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

export interface ThreadProjectContext {
  id: string;
  name: string;
  category: string;
  status: string;
  progressPercent: number;
  currentPhase: string | null;
  thumbnailUrl: string | null;
}

export interface ThreadDocument {
  id: string;
  filename: string;
  createdAt: string;
}

export interface ThreadContext {
  project: ThreadProjectContext | null;
  participants: ThreadParticipant[];
  documents: ThreadDocument[];
}

// Ce qui entoure une conversation.
//
// La maquette montre trois blocs à droite : le projet lié, les
// participants, les fichiers partagés. Les trois sont réels, à une nuance
// près qui change leur nom.
//
// Les « fichiers partagés » ne sont PAS des pièces jointes aux messages :
// request_messages n'a qu'un corps de texte, aucune table de pièce
// jointe n'existe. Ce sont les documents du PROJET lié, donc ils
// s'appellent « Documents du projet ». Les appeler autrement laisserait
// croire qu'ils ont été envoyés dans cette conversation.
//
// Les participants sont dérivés, jamais stockés : le client, plus les
// personnes du studio qui ont réellement écrit dans ce fil, plus le chef
// de projet s'il n'y a pas encore écrit. Aucune table de participants
// n'existe, et en inventer une qui ne se met pas à jour toute seule
// divergerait en une semaine.
export async function getThreadContext(
  threadId: string,
  clientId: string,
  projectId: string | null
): Promise<ThreadContext> {
  const [{ data: messageRows }, { data: project }, { data: documents }] = await Promise.all([
    supabaseAdmin.from("request_messages").select("author_admin_id").eq("thread_id", threadId),
    projectId
      ? supabaseAdmin
          .from("projects")
          .select(
            "id, name, category, status, progress_percent, thumbnail_path, deadline_phase_label, project_manager_id, project_phases(id, name, status, position)"
          )
          .eq("id", projectId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    projectId
      ? supabaseAdmin
          .from("documents")
          .select("id, filename, created_at")
          .eq("project_id", projectId)
          .eq("visibility", "client")
          .order("created_at", { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] as { id: string; filename: string; created_at: string }[] }),
  ]);

  const adminIds = new Set(
    (messageRows ?? []).map((row) => row.author_admin_id as string | null).filter((id): id is string => Boolean(id))
  );
  if (project?.project_manager_id) adminIds.add(project.project_manager_id);

  const { data: clientRow } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, company, email, avatar_path")
    .eq("id", clientId)
    .maybeSingle();

  const { data: adminRows } = adminIds.size
    ? await supabaseAdmin
        .from("profiles")
        .select("id, full_name, display_title, avatar_path")
        .in("id", Array.from(adminIds))
    : { data: [] as { id: string; full_name: string | null; display_title: string | null; avatar_path: string | null }[] };

  const participants: ThreadParticipant[] = [
    ...(clientRow
      ? [
          {
            id: clientRow.id,
            name: clientRow.full_name?.trim() || clientRow.company?.trim() || clientRow.email || "Client",
            role: "Client",
            avatarUrl: getPublicAssetUrl(clientRow.avatar_path),
          },
        ]
      : []),
    ...(adminRows ?? []).map((row) => ({
      id: row.id,
      name: row.full_name?.trim() || "Équipe KOV",
      role: row.display_title?.trim() || "KOV Studio",
      avatarUrl: getPublicAssetUrl(row.avatar_path),
    })),
  ];

  const phases = (project?.project_phases ?? []) as ProjectPhase[];

  return {
    project: project
      ? {
          id: project.id,
          name: project.name,
          category: project.category,
          status: project.status,
          progressPercent: deriveProgress(phases, project.progress_percent).percent,
          currentPhase: deriveCurrentPhase(phases, project.deadline_phase_label).label,
          thumbnailUrl: getPublicAssetUrl(project.thumbnail_path),
        }
      : null,
    participants,
    documents: (documents ?? []).map((row) => ({
      id: row.id,
      filename: row.filename,
      createdAt: row.created_at,
    })),
  };
}
