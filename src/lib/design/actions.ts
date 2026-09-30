"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  addDesignComment,
  approveAllPages,
  createDesignPage,
  createDesignVersion,
  decidePage,
  DesignRuleError,
  editDesignComment,
  publishDesignVersion,
  setCommentStatus,
  setVersionAssets,
  updateDesignPage,
} from "./mutations";
import { getValidationBoard, type Viewer } from "./queries";
import { designAssetPath, uploadDesignAsset } from "./storage";
import type { CommentStatus, Device, PageStatus } from "./status";
import type { ValidationBoard } from "./types";

// Un seul fichier d'actions pour les deux côtés.
//
// L'admin et le client font les mêmes gestes sur les mêmes données ; ce
// sont les droits qui diffèrent, et ils sont déjà dans mutations.ts. Deux
// fichiers d'actions, ce serait la même règle écrite deux fois — et une
// seule des deux corrigée le jour où elle change.
//
// Surtout : le camp de l'appelant n'est JAMAIS un argument. Il est relu
// depuis la session à chaque appel. Un paramètre `viewer` envoyé par le
// navigateur serait une élévation de privilège à un caractère près.

async function resolveViewer(): Promise<Viewer> {
  const user = await requireUser();
  const { data } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { kind: data?.role === "admin" ? "admin" : "client", id: user.id };
}

type Result = { error?: string };

/** Une exception qui traverse une action serveur perd son message et
 *  arrive minifiée côté navigateur. On la rattrape ici, où elle a encore
 *  le sien, et on la renvoie comme donnée. */
async function guard(run: () => Promise<void>): Promise<Result> {
  try {
    await run();
    return {};
  } catch (error) {
    if (error instanceof DesignRuleError) return { error: error.message };
    console.error("[validation]", error);
    return { error: "Une erreur est survenue. Réessayez." };
  }
}

function revalidateBoth(projectId: string) {
  revalidatePath(`/client/projects/${projectId}/validation`);
  revalidatePath(`/admin/projects/${projectId}`);
}

// ── LECTURE ──────────────────────────────────────────────────────────

/** Le tableau complet, rechargé par le sondage du panneau (§35). Passe
 *  par les mêmes vérifications que le rendu initial : un identifiant de
 *  projet deviné ne rend rien. */
export async function fetchValidationBoard(projectId: string): Promise<ValidationBoard | null> {
  const viewer = await resolveViewer();
  return getValidationBoard(projectId, viewer);
}

// ── COMMENTAIRES ─────────────────────────────────────────────────────

export async function addComment(input: {
  projectId: string;
  pageId: string;
  versionId: string;
  parentId?: string | null;
  device?: Device;
  x?: number | null;
  y?: number | null;
  body: string;
  isBlocking?: boolean;
  mentionedIds?: string[];
}): Promise<Result> {
  const viewer = await resolveViewer();
  return guard(async () => {
    await addDesignComment(viewer, input);
    revalidateBoth(input.projectId);
  });
}

export async function changeCommentStatus(
  projectId: string,
  commentId: string,
  status: CommentStatus
): Promise<Result> {
  const viewer = await resolveViewer();
  return guard(async () => {
    await setCommentStatus(viewer, commentId, status);
    revalidateBoth(projectId);
  });
}

export async function editComment(projectId: string, commentId: string, body: string): Promise<Result> {
  const viewer = await resolveViewer();
  return guard(async () => {
    await editDesignComment(viewer, commentId, body);
    revalidateBoth(projectId);
  });
}

// ── VALIDATION ───────────────────────────────────────────────────────

export async function decide(input: {
  projectId: string;
  pageId: string;
  versionId: string;
  decision: "approved" | "changes_requested";
  comment?: string | null;
  override?: boolean;
}): Promise<Result> {
  const viewer = await resolveViewer();
  return guard(async () => {
    await decidePage(viewer, input);
    revalidateBoth(input.projectId);
  });
}

export async function approveEverything(projectId: string, comment?: string | null): Promise<Result> {
  const viewer = await resolveViewer();
  return guard(async () => {
    await approveAllPages(viewer, projectId, comment);
    revalidateBoth(projectId);
  });
}

// ── STRUCTURE (KOV seulement — la règle est dans mutations.ts) ────────

export async function addPage(projectId: string, title: string, visibleToClient = false): Promise<Result> {
  const viewer = await resolveViewer();
  return guard(async () => {
    await createDesignPage(viewer, { projectId, title, visibleToClient });
    revalidateBoth(projectId);
  });
}

export async function patchPage(
  projectId: string,
  pageId: string,
  patch: { title?: string; status?: PageStatus; visibleToClient?: boolean; position?: { x: number; y: number } | null }
): Promise<Result> {
  const viewer = await resolveViewer();
  return guard(async () => {
    await updateDesignPage(viewer, pageId, patch);
    revalidateBoth(projectId);
  });
}

/** Déplacer une page sur la carte. Séparée de patchPage parce qu'elle part
 *  à chaque relâché de souris : elle ne revalide rien, sinon le canvas se
 *  reconstruirait sous le curseur. */
export async function movePage(pageId: string, x: number, y: number): Promise<Result> {
  const viewer = await resolveViewer();
  return guard(async () => {
    await updateDesignPage(viewer, pageId, { position: { x, y } });
  });
}

export async function addVersion(input: {
  projectId: string;
  pageId: string;
  label?: string | null;
  changelog?: string | null;
  previewUrl?: string | null;
}): Promise<Result & { versionId?: string; versionNumber?: number }> {
  const viewer = await resolveViewer();
  try {
    const created = await createDesignVersion(viewer, input);
    revalidateBoth(input.projectId);
    return { versionId: created.id, versionNumber: created.number };
  } catch (error) {
    if (error instanceof DesignRuleError) return { error: error.message };
    console.error("[validation]", error);
    return { error: "La version n'a pas pu être créée." };
  }
}

export async function uploadVersionAsset(formData: FormData): Promise<Result> {
  const viewer = await resolveViewer();
  return guard(async () => {
    const projectId = String(formData.get("projectId") ?? "");
    const pageId = String(formData.get("pageId") ?? "");
    const versionId = String(formData.get("versionId") ?? "");
    const versionNumber = Number(formData.get("versionNumber") ?? 0);
    const device = String(formData.get("device") ?? "desktop") as Device;
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) throw new DesignRuleError("Aucun fichier reçu.");

    const path = designAssetPath({ projectId, pageId, versionNumber, device, filename: file.name });
    await uploadDesignAsset(path, file);
    await setVersionAssets(viewer, versionId, { [device]: path });
    revalidateBoth(projectId);
  });
}

export async function publishVersion(projectId: string, versionId: string): Promise<Result> {
  const viewer = await resolveViewer();
  return guard(async () => {
    await publishDesignVersion(viewer, versionId);
    revalidateBoth(projectId);
  });
}
