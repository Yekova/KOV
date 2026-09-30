import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { signDesignAssets, sanitizePreviewUrl } from "./storage";
import { isCommentPending, PAGE_STATUS_WAITING_ON, type AuthorSide, type CommentStatus, type Device, type PageStatus, type VersionStatus } from "./status";
import type { DesignApproval, DesignActivityEntry, DesignComment, DesignPage, DesignVersion, ValidationBoard } from "./types";

export interface Viewer {
  kind: AuthorSide;
  id: string;
}

// ── CE QUI EST FILTRÉ, ET OÙ ─────────────────────────────────────────
//
// Le filtrage se fait DANS la requête, jamais après. Une page invisible
// n'est pas chargée puis masquée à l'affichage : elle ne quitte pas la
// base. C'est la même frontière que décrivent les politiques RLS posées
// par la migration — elles ne sont pas le chemin de lecture ici, mais
// elles disent la même chose, et les deux doivent rester d'accord.

const CLIENT_VISIBLE_VERSIONS: VersionStatus[] = ["published", "superseded"];

interface PageRow {
  id: string;
  title: string;
  slug: string;
  sort_order: number;
  status: PageStatus;
  visible_to_client: boolean;
  position_x: number | null;
  position_y: number | null;
}

interface VersionRow {
  id: string;
  page_id: string;
  version_label: string;
  version_number: number;
  status: VersionStatus;
  changelog: string | null;
  desktop_path: string | null;
  tablet_path: string | null;
  mobile_path: string | null;
  preview_url: string | null;
  published_at: string | null;
  created_at: string;
}

interface CommentRow {
  id: string;
  page_id: string;
  version_id: string;
  parent_id: string | null;
  device: Device;
  author_id: string;
  author_side: AuthorSide;
  x_percent: string | number | null;
  y_percent: string | number | null;
  body: string;
  status: CommentStatus;
  is_blocking: boolean;
  mentioned_ids: string[] | null;
  attachment_path: string | null;
  created_at: string;
  edited_at: string | null;
  resolved_at: string | null;
}

/** `numeric` revient en chaîne depuis PostgREST — le laisser tel quel
 *  placerait l'épingle à `NaN %`. */
function toNumber(value: string | number | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function resolveNames(ids: string[]): Promise<Map<string, string | null>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const names = new Map<string, string | null>();
  if (unique.length === 0) return names;
  const { data } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", unique);
  for (const row of data ?? []) names.set(row.id, row.full_name ?? null);
  return names;
}

export async function getValidationBoard(projectId: string, viewer: Viewer): Promise<ValidationBoard | null> {
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, name, client_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return null;
  // Un client ne lit que ses projets. La vérification est ici et non dans
  // la page : toute page qui appellerait cette fonction en hérite.
  if (viewer.kind === "client" && project.client_id !== viewer.id) return null;

  let pageQuery = supabaseAdmin
    .from("design_pages")
    .select("id, title, slug, sort_order, status, visible_to_client, position_x, position_y")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (viewer.kind === "client") pageQuery = pageQuery.eq("visible_to_client", true);

  const { data: pageRows } = await pageQuery;
  const pages = (pageRows ?? []) as PageRow[];
  const pageIds = pages.map((p) => p.id);

  if (pageIds.length === 0) {
    return {
      projectId,
      projectName: project.name,
      viewer: viewer.kind,
      viewerId: viewer.id,
      pages: [],
      tally: { open: 0, waitingOnClient: 0, waitingOnKov: 0, approvedPages: 0, totalPages: 0 },
      finalApproval: null,
      canApproveAll: false,
    };
  }

  let versionQuery = supabaseAdmin
    .from("design_versions")
    .select("id, page_id, version_label, version_number, status, changelog, desktop_path, tablet_path, mobile_path, preview_url, published_at, created_at")
    .in("page_id", pageIds)
    .order("version_number", { ascending: false });
  if (viewer.kind === "client") versionQuery = versionQuery.in("status", CLIENT_VISIBLE_VERSIONS);

  const [{ data: versionRows }, { data: commentRows }, { data: approvalRows }] = await Promise.all([
    versionQuery,
    supabaseAdmin
      .from("design_comments")
      .select("id, page_id, version_id, parent_id, device, author_id, author_side, x_percent, y_percent, body, status, is_blocking, mentioned_ids, attachment_path, created_at, edited_at, resolved_at")
      .in("page_id", pageIds)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("design_approvals")
      .select("id, page_id, version_id, decision, approved_by, approver_side, is_override, comment, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
  ]);

  const versions = (versionRows ?? []) as VersionRow[];
  const comments = (commentRows ?? []) as CommentRow[];

  // ── Les URL signées, toutes en un appel ──────────────────────────────
  const assetPaths = versions.flatMap((v) => [v.desktop_path, v.tablet_path, v.mobile_path].filter((p): p is string => Boolean(p)));
  const attachmentPaths = comments.map((c) => c.attachment_path).filter((p): p is string => Boolean(p));
  const signed = await signDesignAssets([...assetPaths, ...attachmentPaths]);

  const names = await resolveNames([
    ...comments.map((c) => c.author_id),
    ...(approvalRows ?? []).map((a) => a.approved_by as string),
  ]);

  // ── Les commentaires, en fils ────────────────────────────────────────
  const byId = new Map<string, DesignComment>();
  const roots: DesignComment[] = [];
  for (const row of comments) {
    const node: DesignComment = {
      id: row.id,
      pageId: row.page_id,
      versionId: row.version_id,
      parentId: row.parent_id,
      device: row.device,
      authorId: row.author_id,
      authorSide: row.author_side,
      authorName: names.get(row.author_id) ?? null,
      x: toNumber(row.x_percent),
      y: toNumber(row.y_percent),
      body: row.body,
      status: row.status,
      isBlocking: row.is_blocking,
      mentionedIds: row.mentioned_ids ?? [],
      attachmentUrl: row.attachment_path ? (signed.get(row.attachment_path) ?? null) : null,
      createdAt: row.created_at,
      editedAt: row.edited_at,
      resolvedAt: row.resolved_at,
      // §48 : on modifie son propre retour, tant qu'il n'est pas réglé.
      // Aucun rôle « superadmin » n'existe dans ce projet — la règle est
      // donc la même des deux côtés, sans exception inventée.
      canEdit: row.author_id === viewer.id && row.status !== "resolved",
      replies: [],
    };
    byId.set(row.id, node);
  }
  for (const node of byId.values()) {
    if (node.parentId) byId.get(node.parentId)?.replies.push(node);
    else roots.push(node);
  }

  // ── Les pages ────────────────────────────────────────────────────────
  const approvals = (approvalRows ?? []).map<DesignApproval>((row) => ({
    id: row.id as string,
    pageId: row.page_id as string | null,
    versionId: row.version_id as string | null,
    decision: row.decision as DesignApproval["decision"],
    approverName: names.get(row.approved_by as string) ?? null,
    approverSide: row.approver_side as AuthorSide,
    isOverride: row.is_override as boolean,
    comment: row.comment as string | null,
    createdAt: row.created_at as string,
  }));

  const builtPages: DesignPage[] = pages.map((page) => {
    const own = versions.filter((v) => v.page_id === page.id);
    const published = own.filter((v) => v.status === "published");
    // La version ouverte par défaut : la dernière publiée, faute de quoi
    // la dernière tout court. Même règle des deux côtés — le studio voit
    // simplement plus de versions dans la liste.
    const current = published[0] ?? own[0] ?? null;

    const rootsHere = roots.filter((c) => c.pageId === page.id && c.versionId === current?.id);
    const approvedHere = approvals.find((a) => a.pageId === page.id && a.decision === "approved") ?? null;

    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      sortOrder: page.sort_order,
      status: page.status,
      visibleToClient: page.visible_to_client,
      position:
        page.position_x !== null && page.position_y !== null ? { x: page.position_x, y: page.position_y } : null,
      versions: own.map<DesignVersion>((v) => ({
        id: v.id,
        pageId: v.page_id,
        label: v.version_label,
        number: v.version_number,
        status: v.status,
        changelog: v.changelog,
        assets: {
          ...(v.desktop_path && signed.has(v.desktop_path) ? { desktop: signed.get(v.desktop_path)! } : {}),
          ...(v.tablet_path && signed.has(v.tablet_path) ? { tablet: signed.get(v.tablet_path)! } : {}),
          ...(v.mobile_path && signed.has(v.mobile_path) ? { mobile: signed.get(v.mobile_path)! } : {}),
        },
        previewUrl: sanitizePreviewUrl(v.preview_url),
        publishedAt: v.published_at,
        createdAt: v.created_at,
      })),
      currentVersionId: current?.id ?? null,
      threads: rootsHere,
      commentCount: rootsHere.length,
      openCount: rootsHere.filter((c) => isCommentPending(c.status)).length,
      blockingCount: rootsHere.filter((c) => c.isBlocking && isCommentPending(c.status)).length,
      approvedAt: approvedHere?.createdAt ?? null,
    };
  });

  // ── Les compteurs du §50 ─────────────────────────────────────────────
  const tally = {
    open: builtPages.reduce((sum, p) => sum + p.openCount, 0),
    waitingOnClient: builtPages.filter((p) => PAGE_STATUS_WAITING_ON[p.status] === "client").length,
    waitingOnKov: builtPages.filter((p) => PAGE_STATUS_WAITING_ON[p.status] === "kov").length,
    approvedPages: builtPages.filter((p) => p.status === "approved").length,
    totalPages: builtPages.length,
  };

  const finalApproval = approvals.find((a) => a.pageId === null && a.decision === "approved") ?? null;

  return {
    projectId,
    projectName: project.name,
    viewer: viewer.kind,
    viewerId: viewer.id,
    pages: builtPages,
    tally,
    finalApproval,
    // La validation d'ensemble ne s'ouvre que quand chaque page est
    // validée, et il faut au moins une page : sur un projet vide, « tout
    // est validé » serait vrai et absurde.
    canApproveAll: tally.totalPages > 0 && tally.approvedPages === tally.totalPages && !finalApproval,
  };
}

export async function getDesignActivity(projectId: string, limit = 30): Promise<DesignActivityEntry[]> {
  const { data } = await supabaseAdmin
    .from("design_activity")
    .select("id, page_id, actor_id, actor_side, event, summary, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const names = await resolveNames(rows.map((r) => r.actor_id as string).filter(Boolean));

  return rows.map((row) => ({
    id: row.id as string,
    pageId: row.page_id as string | null,
    actorName: names.get(row.actor_id as string) ?? null,
    actorSide: row.actor_side as DesignActivityEntry["actorSide"],
    event: row.event as string,
    summary: row.summary as string,
    createdAt: row.created_at as string,
  }));
}
