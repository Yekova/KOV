import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "@/lib/activity";
import { sanitizePreviewUrl } from "./storage";
import type { CommentStatus, Device, PageStatus } from "./status";
import type { Viewer } from "./queries";

// Toutes les écritures de la validation, et les règles qui les encadrent.
//
// Elles vivent ici plutôt que dans les actions serveur parce qu'il y a
// DEUX jeux d'actions — un par côté — et qu'une règle écrite deux fois
// finit par ne l'être qu'à moitié. Les actions vérifient l'identité ;
// ce module vérifie le droit.
//
// Les fonctions lèvent. Les actions rattrapent et renvoient `{ error }` :
// une exception qui traverse une action serveur perd son message et
// arrive au navigateur en erreur React minifiée.

class DesignRuleError extends Error {}

/** Ce que le client n'a pas le droit de faire (§34). */
function assertAdmin(viewer: Viewer, what: string): void {
  if (viewer.kind !== "admin") throw new DesignRuleError(`Action réservée à KOV : ${what}.`);
}

async function loadPage(pageId: string) {
  const { data } = await supabaseAdmin
    .from("design_pages")
    .select("id, project_id, title, status, visible_to_client")
    .eq("id", pageId)
    .maybeSingle();
  if (!data) throw new DesignRuleError("Page introuvable.");
  return data;
}

async function projectClientId(projectId: string): Promise<string> {
  const { data } = await supabaseAdmin.from("projects").select("client_id").eq("id", projectId).maybeSingle();
  if (!data) throw new DesignRuleError("Projet introuvable.");
  return data.client_id as string;
}

/** Le client n'atteint que son propre projet. Vérifié à chaque écriture,
 *  pas seulement à la lecture de la page. */
async function assertViewerOwnsProject(viewer: Viewer, projectId: string): Promise<void> {
  if (viewer.kind === "admin") return;
  if ((await projectClientId(projectId)) !== viewer.id) throw new DesignRuleError("Projet introuvable.");
}

async function journal(params: {
  projectId: string;
  pageId?: string | null;
  versionId?: string | null;
  commentId?: string | null;
  viewer: Viewer;
  event: string;
  summary: string;
}) {
  await supabaseAdmin.from("design_activity").insert({
    project_id: params.projectId,
    page_id: params.pageId ?? null,
    version_id: params.versionId ?? null,
    comment_id: params.commentId ?? null,
    actor_id: params.viewer.id,
    actor_side: params.viewer.kind,
    event: params.event,
    summary: params.summary,
  });
}

// ── LES PAGES ────────────────────────────────────────────────────────

function slugify(title: string): string {
  return (
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "page"
  );
}

export async function createDesignPage(
  viewer: Viewer,
  input: { projectId: string; title: string; visibleToClient?: boolean }
): Promise<string> {
  assertAdmin(viewer, "créer une page");
  const title = input.title.trim();
  if (!title) throw new DesignRuleError("Le titre est obligatoire.");

  const { data: last } = await supabaseAdmin
    .from("design_pages")
    .select("sort_order")
    .eq("project_id", input.projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Le slug doit rester unique dans le projet : la base le contraint, et
  // deux pages « Accueil » sont un cas normal, pas une erreur de saisie.
  const base = slugify(title);
  const { data: taken } = await supabaseAdmin
    .from("design_pages")
    .select("slug")
    .eq("project_id", input.projectId)
    .like("slug", `${base}%`);
  const used = new Set((taken ?? []).map((r) => r.slug as string));
  let slug = base;
  for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`;

  const { data, error } = await supabaseAdmin
    .from("design_pages")
    .insert({
      project_id: input.projectId,
      title,
      slug,
      sort_order: (last?.sort_order ?? 0) + 1,
      visible_to_client: input.visibleToClient ?? false,
      created_by: viewer.id,
    })
    .select("id")
    .single();

  if (error || !data) throw new DesignRuleError("La page n'a pas pu être créée.");

  await journal({ projectId: input.projectId, pageId: data.id, viewer, event: "page_created", summary: `Page « ${title} » ajoutée` });
  return data.id;
}

export async function updateDesignPage(
  viewer: Viewer,
  pageId: string,
  patch: { title?: string; status?: PageStatus; visibleToClient?: boolean; position?: { x: number; y: number } | null }
): Promise<void> {
  assertAdmin(viewer, "modifier une page");
  const page = await loadPage(pageId);

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) throw new DesignRuleError("Le titre est obligatoire.");
    update.title = title;
  }
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.visibleToClient !== undefined) update.visible_to_client = patch.visibleToClient;
  if (patch.position !== undefined) {
    update.position_x = patch.position?.x ?? null;
    update.position_y = patch.position?.y ?? null;
  }

  const { error } = await supabaseAdmin.from("design_pages").update(update).eq("id", pageId);
  if (error) throw new DesignRuleError("La page n'a pas pu être modifiée.");

  // Rendre une page visible est le moment où le client la découvre : il
  // mérite une notification, contrairement à un déplacement sur la carte.
  if (patch.visibleToClient === true && !page.visible_to_client) {
    await journal({ projectId: page.project_id, pageId, viewer, event: "page_published", summary: `Page « ${page.title} » ouverte à la validation` });
  }
}

// ── LES VERSIONS ─────────────────────────────────────────────────────

export async function createDesignVersion(
  viewer: Viewer,
  input: { pageId: string; label?: string | null; changelog?: string | null; previewUrl?: string | null }
): Promise<{ id: string; number: number }> {
  assertAdmin(viewer, "créer une version");
  const page = await loadPage(input.pageId);

  const { data: last } = await supabaseAdmin
    .from("design_versions")
    .select("version_number")
    .eq("page_id", input.pageId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const next = (last?.version_number ?? 0) + 1;
  // L'étiquette proposée est « v3 » quand c'est la troisième. Ce n'est
  // qu'une proposition : la numérotation d'une maquette (v2.1, v2.2)
  // appartient à celui qui la dessine, pas à la base.
  const label = input.label?.trim() || `v${next}`;

  const { data, error } = await supabaseAdmin
    .from("design_versions")
    .insert({
      page_id: input.pageId,
      project_id: page.project_id,
      version_label: label,
      version_number: next,
      changelog: input.changelog?.trim() || null,
      preview_url: sanitizePreviewUrl(input.previewUrl),
      created_by: viewer.id,
    })
    .select("id")
    .single();

  if (error || !data) throw new DesignRuleError("La version n'a pas pu être créée.");
  return { id: data.id, number: next };
}

export async function setVersionAssets(
  viewer: Viewer,
  versionId: string,
  paths: Partial<Record<Device, string>>
): Promise<void> {
  assertAdmin(viewer, "téléverser une maquette");
  const update: Record<string, string> = {};
  if (paths.desktop) update.desktop_path = paths.desktop;
  if (paths.tablet) update.tablet_path = paths.tablet;
  if (paths.mobile) update.mobile_path = paths.mobile;
  if (Object.keys(update).length === 0) return;

  const { error } = await supabaseAdmin.from("design_versions").update(update).eq("id", versionId);
  if (error) throw new DesignRuleError("La maquette n'a pas pu être enregistrée.");
}

export async function publishDesignVersion(viewer: Viewer, versionId: string): Promise<void> {
  assertAdmin(viewer, "publier une version");

  const { data: version } = await supabaseAdmin
    .from("design_versions")
    .select("id, page_id, project_id, version_label, status, desktop_path, tablet_path, mobile_path")
    .eq("id", versionId)
    .maybeSingle();
  if (!version) throw new DesignRuleError("Version introuvable.");
  if (version.status === "published") return;

  // Publier une version sans maquette enverrait le client devant un
  // cadre vide en lui demandant de valider.
  if (!version.desktop_path && !version.tablet_path && !version.mobile_path) {
    throw new DesignRuleError("Ajoutez au moins une maquette avant de publier.");
  }

  const page = await loadPage(version.page_id);

  // La version précédente devient « remplacée » et non « archivée » :
  // elle reste comparable, et ses commentaires gardent leur contexte.
  await supabaseAdmin
    .from("design_versions")
    .update({ status: "superseded" })
    .eq("page_id", version.page_id)
    .eq("status", "published");

  await supabaseAdmin
    .from("design_versions")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", versionId);

  await supabaseAdmin
    .from("design_pages")
    .update({ status: "client_review", visible_to_client: true, updated_at: new Date().toISOString() })
    .eq("id", version.page_id);

  await journal({
    projectId: version.project_id,
    pageId: version.page_id,
    versionId,
    viewer,
    event: "version_published",
    summary: `${version.version_label} publiée sur « ${page.title} »`,
  });

  // L'un des trois évènements qui méritent la cloche du client.
  await logActivity({
    clientId: await projectClientId(version.project_id),
    projectId: version.project_id,
    type: "validation",
    title: `Nouvelle version à valider : ${page.title}`,
    adminTitle: `${version.version_label} publiée sur « ${page.title} »`,
    actorId: viewer.id,
  });
}

// ── LES COMMENTAIRES ─────────────────────────────────────────────────

export async function addDesignComment(
  viewer: Viewer,
  input: {
    pageId: string;
    versionId: string;
    parentId?: string | null;
    device?: Device;
    x?: number | null;
    y?: number | null;
    body: string;
    isBlocking?: boolean;
    mentionedIds?: string[];
    attachmentPath?: string | null;
  }
): Promise<string> {
  const page = await loadPage(input.pageId);
  await assertViewerOwnsProject(viewer, page.project_id);

  const body = input.body.trim();
  if (!body) throw new DesignRuleError("Le commentaire est vide.");

  // Une réponse n'a pas d'épingle — la base le refuse, autant ne pas la
  // lui envoyer.
  const isReply = Boolean(input.parentId);
  const x = isReply ? null : (input.x ?? null);
  const y = isReply ? null : (input.y ?? null);

  const { data, error } = await supabaseAdmin
    .from("design_comments")
    .insert({
      project_id: page.project_id,
      page_id: input.pageId,
      version_id: input.versionId,
      parent_id: input.parentId ?? null,
      device: input.device ?? "desktop",
      author_id: viewer.id,
      author_side: viewer.kind,
      x_percent: x,
      y_percent: y,
      body,
      is_blocking: isReply ? false : (input.isBlocking ?? false),
      mentioned_ids: input.mentionedIds ?? [],
      attachment_path: input.attachmentPath ?? null,
    })
    .select("id")
    .single();

  if (error || !data) throw new DesignRuleError("Le commentaire n'a pas pu être enregistré.");

  await journal({
    projectId: page.project_id,
    pageId: input.pageId,
    versionId: input.versionId,
    commentId: data.id,
    viewer,
    event: isReply ? "comment_replied" : "comment_created",
    summary: isReply ? `Réponse sur « ${page.title} »` : `Nouveau retour sur « ${page.title} »`,
  });

  return data.id;
}

export async function setCommentStatus(viewer: Viewer, commentId: string, status: CommentStatus): Promise<void> {
  const { data: comment } = await supabaseAdmin
    .from("design_comments")
    .select("id, project_id, page_id, parent_id, status, author_id")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment) throw new DesignRuleError("Commentaire introuvable.");
  if (comment.parent_id) throw new DesignRuleError("Une réponse n'a pas de statut propre.");
  await assertViewerOwnsProject(viewer, comment.project_id);

  // §56 : le client peut rouvrir un retour qu'il juge mal réglé, mais
  // c'est KOV qui déclare « en cours » ou « non retenu » — ce sont des
  // engagements de traitement.
  if (viewer.kind === "client" && status !== "open") {
    throw new DesignRuleError("Vous pouvez rouvrir un retour ; c'est KOV qui le traite.");
  }

  const resolving = status === "resolved" || status === "rejected";
  const { error } = await supabaseAdmin
    .from("design_comments")
    .update({
      status,
      resolved_at: resolving ? new Date().toISOString() : null,
      resolved_by: resolving ? viewer.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId);
  if (error) throw new DesignRuleError("Le statut n'a pas pu être changé.");

  await journal({
    projectId: comment.project_id,
    pageId: comment.page_id,
    commentId,
    viewer,
    event: "comment_status_changed",
    summary: `Retour passé à « ${status} »`,
  });
}

export async function editDesignComment(viewer: Viewer, commentId: string, body: string): Promise<void> {
  const text = body.trim();
  if (!text) throw new DesignRuleError("Le commentaire est vide.");

  const { data: comment } = await supabaseAdmin
    .from("design_comments")
    .select("id, author_id, status")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment) throw new DesignRuleError("Commentaire introuvable.");

  // §48, appliqué des deux côtés : il n'existe pas de rôle « superadmin »
  // dans ce projet, donc aucune exception n'est inventée ici.
  if (comment.author_id !== viewer.id) throw new DesignRuleError("On ne modifie que ses propres retours.");
  if (comment.status === "resolved") throw new DesignRuleError("Ce retour est réglé : il ne se modifie plus.");

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("design_comments")
    .update({ body: text, edited_at: now, updated_at: now })
    .eq("id", commentId);
  if (error) throw new DesignRuleError("La modification n'a pas pu être enregistrée.");
}

// ── LES VALIDATIONS ──────────────────────────────────────────────────

async function countBlocking(pageId: string, versionId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("design_comments")
    .select("id", { count: "exact", head: true })
    .eq("page_id", pageId)
    .eq("version_id", versionId)
    .is("parent_id", null)
    .eq("is_blocking", true)
    .in("status", ["open", "in_progress"]);
  return count ?? 0;
}

export async function decidePage(
  viewer: Viewer,
  input: {
    pageId: string;
    versionId: string;
    decision: "approved" | "changes_requested";
    comment?: string | null;
    override?: boolean;
  }
): Promise<void> {
  const page = await loadPage(input.pageId);
  await assertViewerOwnsProject(viewer, page.project_id);

  const override = Boolean(input.override) && viewer.kind === "admin";

  if (input.decision === "approved") {
    // §27 : un retour bloquant ouvert interdit la validation. KOV peut
    // passer outre, et le passage en force est enregistré comme tel.
    const blocking = await countBlocking(input.pageId, input.versionId);
    if (blocking > 0 && !override) {
      throw new DesignRuleError(
        blocking === 1
          ? "Un retour bloquant est encore ouvert sur cette page."
          : `${blocking} retours bloquants sont encore ouverts sur cette page.`
      );
    }
  } else {
    // §26 : demander des modifications sans dire lesquelles, c'est
    // renvoyer le travail sans le contexte. Au moins un retour ouvert.
    const { count } = await supabaseAdmin
      .from("design_comments")
      .select("id", { count: "exact", head: true })
      .eq("page_id", input.pageId)
      .eq("version_id", input.versionId)
      .is("parent_id", null)
      .in("status", ["open", "in_progress"]);
    if ((count ?? 0) === 0) {
      throw new DesignRuleError("Déposez d'abord au moins un retour : sans contexte, la demande est ininterprétable.");
    }
  }

  await supabaseAdmin.from("design_approvals").insert({
    project_id: page.project_id,
    page_id: input.pageId,
    version_id: input.versionId,
    decision: input.decision,
    approved_by: viewer.id,
    approver_side: viewer.kind,
    is_override: override,
    comment: input.comment?.trim() || null,
  });

  await supabaseAdmin
    .from("design_pages")
    .update({
      status: input.decision === "approved" ? "approved" : "changes_requested",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.pageId);

  await journal({
    projectId: page.project_id,
    pageId: input.pageId,
    versionId: input.versionId,
    viewer,
    event: input.decision === "approved" ? "page_approved" : "changes_requested",
    summary:
      input.decision === "approved"
        ? `Page « ${page.title} » validée${override ? " (validation forcée)" : ""}`
        : `Modifications demandées sur « ${page.title} »`,
  });

  // La cloche : c'est KOV qu'une décision du client concerne, et
  // inversement. On ne notifie jamais quelqu'un de sa propre action.
  if (viewer.kind === "client") {
    await logActivity({
      clientId: await projectClientId(page.project_id),
      projectId: page.project_id,
      type: "validation",
      title: input.decision === "approved" ? `Vous avez validé « ${page.title} »` : `Vous avez demandé des modifications sur « ${page.title} »`,
      adminTitle:
        input.decision === "approved"
          ? `Le client a validé « ${page.title} »`
          : `Le client demande des modifications sur « ${page.title} »`,
      actorId: viewer.id,
    });
  }
}

export async function approveAllPages(viewer: Viewer, projectId: string, comment?: string | null): Promise<void> {
  await assertViewerOwnsProject(viewer, projectId);

  const { data: pages } = await supabaseAdmin
    .from("design_pages")
    .select("id, status")
    .eq("project_id", projectId)
    .eq("visible_to_client", true);

  const list = pages ?? [];
  if (list.length === 0) throw new DesignRuleError("Aucune page à valider.");
  const pending = list.filter((p) => p.status !== "approved");
  if (pending.length > 0) {
    throw new DesignRuleError(
      pending.length === 1 ? "Une page reste à valider." : `${pending.length} pages restent à valider.`
    );
  }

  const { data: already } = await supabaseAdmin
    .from("design_approvals")
    .select("id")
    .eq("project_id", projectId)
    .is("page_id", null)
    .eq("decision", "approved")
    .maybeSingle();
  if (already) return;

  await supabaseAdmin.from("design_approvals").insert({
    project_id: projectId,
    page_id: null,
    version_id: null,
    decision: "approved",
    approved_by: viewer.id,
    approver_side: viewer.kind,
    comment: comment?.trim() || null,
  });

  await journal({ projectId, viewer, event: "final_approved", summary: "Ensemble des maquettes validé" });

  await logActivity({
    clientId: await projectClientId(projectId),
    projectId,
    type: "validation",
    title: "Vous avez validé l'ensemble des maquettes",
    adminTitle: "Le client a validé l'ensemble des maquettes",
    actorId: viewer.id,
  });
}

export { DesignRuleError };
