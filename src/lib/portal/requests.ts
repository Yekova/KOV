import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { deriveCurrentPhase, deriveProgress, type ProjectPhase } from "@/lib/portal/progress";
import { deriveRequestWaitingOn, type RequestWaitingOn } from "@/lib/portal/status";
import { getMessageExtras, type MessageAttachmentView, type MessageReactionSummary } from "@/lib/messaging/extras";

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
  /** Quand CE côté l'a mise à la corbeille. Null tant qu'elle est dans la
   *  liste — la suppression est personnelle, donc la date l'est aussi. */
  deletedAt: string | null;
}

export interface MyThreadMessage {
  id: string;
  body: string;
  createdBy: "client" | "admin";
  createdAt: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  /** Supprimé par son auteur. Le corps n'est alors PAS transmis. */
  deleted: boolean;
  /** Le message cité, résolu dans le même fil — aucune requête de plus. */
  replyTo: { id: string; authorName: string | null; excerpt: string } | null;
  reactions: MessageReactionSummary[];
  attachments: MessageAttachmentView[];
  /** De mon côté du fil. Côté studio, c'est « écrit par le studio » et
   *  non « écrit par moi » : le message d'un collègue doit rester du côté
   *  du studio, sinon il se retrouverait aligné avec ceux du client et le
   *  fil cesserait de se lire comme un échange entre deux parties. */
  mine: boolean;
  /** Écrit par MOI, personnellement — d'où deux drapeaux et non un : le
   *  côté est collectif, le droit de supprimer ne l'est pas. Il vaut aussi
   *  pour la restauration, donc il reste vrai sur un message supprimé :
   *  sans quoi son auteur n'aurait plus aucun moyen de le récupérer. */
  canDelete: boolean;
}

/** Qui regarde le fil. Décide de « mes » réactions et de ce que je peux
 *  supprimer — la seule chose qui distingue les deux côtés. */
export interface ThreadViewer {
  id: string;
  kind: "client" | "admin";
}

/**
 * Les conversations du client.
 *
 * `trashed` bascule entre la liste et « Supprimés récemment ». La
 * suppression est PERSONNELLE : elle pose deleted_by_client_at et ne
 * touche pas à la vue du studio. Une relation commerciale ne doit pas
 * permettre de faire disparaître un engagement écrit de l'écran d'en
 * face.
 *
 * Le filtre est appliqué en mémoire et non par .is() : une clause .is() sur une
 * colonne absente ferait échouer la requête entière — donc toute la messagerie.
 */
export async function getMyRequestThreads(
  clientId: string,
  { trashed = false }: { trashed?: boolean } = {}
): Promise<MyThreadSummary[]> {
  const { data: threadRows } = await supabaseAdmin
    .from("request_threads")
    .select("*")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });

  const threads = (threadRows ?? []).filter((row) => {
    const deletedAt = (row as { deleted_by_client_at?: string | null }).deleted_by_client_at ?? null;
    return trashed ? Boolean(deletedAt) : !deletedAt;
  });
  if (threads.length === 0) return [];

  const projectIds = Array.from(
    new Set(threads.map((row) => row.project_id as string | null).filter((id): id is string => Boolean(id)))
  );

  const [{ data: messageRows }, { data: projectRows }] = await Promise.all([
    supabaseAdmin
      // « * » plutôt que des colonnes nommées : voir getThreadMessages.
      .from("request_messages")
      .select("*")
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
    // Un message supprimé ne compte pas et ne sert pas d'extrait : la
    // liste annoncerait sinon « 4 messages » pour un fil qui en montre 3,
    // et afficherait comme dernier mot un texte que plus personne ne voit.
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
      deletedAt: (row as { deleted_by_client_at?: string | null }).deleted_by_client_at ?? null,
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

  return { summary, messages: await getThreadMessages(threadId, clientId, { id: clientId, kind: "client" }) };
}

// Les messages et leurs auteurs, pour les deux côtés.
//
// Le studio avait sa propre copie de cette fonction (lib/admin/requests).
// Les deux ont convergé ici : écrire deux fois les réponses citées, les
// réactions, les pièces jointes et la suppression, c'était s'assurer que
// les deux écrans finiraient par ne plus montrer la même conversation.
//
// Les portraits comptent : un fil sans visage se lit comme un journal, pas
// comme un échange.
//
// ── SELECT("*") EST DÉLIBÉRÉ ─────────────────────────────────────────
//
// reply_to_id et deleted_at sont nées avec la migration 20260929140000,
// désormais appliquée. « * » reste : nommer les colonnes une par une fait
// échouer TOUTE la requête à la première qui manque — c'est exactement le
// bug qui avait vidé /client/quotes pendant des semaines (une colonne
// signed_at qui n'existait pas). Ici, une colonne absente rend un champ
// indéfini, et le fil s'affiche quand même.
export async function getThreadMessages(
  threadId: string,
  clientId: string,
  viewer: ThreadViewer = { id: clientId, kind: "client" }
): Promise<MyThreadMessage[]> {
  const { data: messageRows } = await supabaseAdmin
    .from("request_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const rows = (messageRows ?? []) as {
    id: string;
    body: string;
    created_by: "client" | "admin";
    created_at: string;
    author_admin_id: string | null;
    reply_to_id?: string | null;
    deleted_at?: string | null;
  }[];

  const peopleIds = Array.from(
    new Set([clientId, ...rows.map((row) => row.author_admin_id).filter((id): id is string => Boolean(id))])
  );

  const [{ data: profileRows }, extras] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, company, email, avatar_path, display_title")
      .in("id", peopleIds),
    getMessageExtras(
      rows.map((row) => row.id),
      viewer.id
    ),
  ]);

  const people = new Map(
    (profileRows ?? []).map((row) => [
      row.id,
      {
        name: row.full_name?.trim() || row.company?.trim() || row.email || null,
        avatarUrl: getPublicAssetUrl(row.avatar_path),
      },
    ])
  );

  function authorOf(row: (typeof rows)[number]) {
    return row.created_by === "admin"
      ? row.author_admin_id
        ? people.get(row.author_admin_id)
        : null
      : people.get(clientId);
  }

  // Le message cité vit dans le même fil : il est déjà chargé. Le résoudre
  // ici évite une requête par citation, et surtout évite de citer un
  // message d'un autre fil.
  const byId = new Map(rows.map((row) => [row.id, row]));

  return rows.map((row) => {
    const author = authorOf(row);
    const deleted = Boolean(row.deleted_at);

    const quoted = row.reply_to_id ? byId.get(row.reply_to_id) : undefined;
    const quotedAuthor = quoted ? authorOf(quoted) : null;

    return {
      id: row.id,
      // Le corps d'un message supprimé ne quitte JAMAIS le serveur : il
      // reste en base pour pouvoir être restauré, il ne part pas dans la
      // page où n'importe quel outil de développement le relirait.
      body: deleted ? "" : row.body,
      createdBy: row.created_by,
      createdAt: row.created_at,
      authorName: author?.name ?? (row.created_by === "admin" ? "Équipe KOV" : null),
      authorAvatarUrl: author?.avatarUrl ?? null,
      deleted,
      replyTo:
        quoted && !quoted.deleted_at
          ? {
              id: quoted.id,
              authorName: quotedAuthor?.name ?? (quoted.created_by === "admin" ? "Équipe KOV" : null),
              excerpt: quoted.body.replace(/\s+/g, " ").trim().slice(0, 140),
            }
          : null,
      reactions: extras.get(row.id)?.reactions ?? [],
      attachments: extras.get(row.id)?.attachments ?? [],
      mine: viewer.kind === "admin" ? row.created_by === "admin" : row.created_by === "client",
      canDelete: viewer.kind === "admin" ? row.author_admin_id === viewer.id : row.created_by === "client",
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
