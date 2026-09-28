import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PORTAL_ASSETS_BUCKET = "portal-assets";
const CLIENT_FILES_BUCKET = "client-files";

// No bucket-level limit is configured in Supabase Storage for either bucket,
// so without this a multi-GB upload would sit in the request until it times
// out instead of failing fast with a readable message.
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function assertUploadable(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo — 25 Mo maximum).`);
  }
}

export function getPublicAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const { data } = supabaseAdmin.storage.from(PORTAL_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// posts.cover_image_path (and any similar column storing an image
// reference the admin picked via the ImagePicker component) can hold
// either shape depending on when the row was last saved: older rows store
// a raw Storage path (needs getPublicAssetUrl), rows saved through
// ImagePicker store an already-public URL directly (it uploads then hands
// back a full URL, never a bare path). This resolves either to a working
// <img src>.
export function resolvePostImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.startsWith("http") ? value : getPublicAssetUrl(value);
}

export async function uploadPortalAsset(path: string, file: File) {
  assertUploadable(file);
  const { error } = await supabaseAdmin.storage.from(PORTAL_ASSETS_BUCKET).upload(path, file, {
    upsert: true,
  });
  if (error) throw new Error("Le téléversement a échoué.");
}

export async function uploadClientFile(path: string, file: File) {
  assertUploadable(file);
  const { error } = await supabaseAdmin.storage.from(CLIENT_FILES_BUCKET).upload(path, file, {
    upsert: true,
  });
  if (error) throw new Error("Le téléversement a échoué.");
}

// For server-generated content (invoice/devis PDFs) — no File/Blob to wrap,
// just the raw bytes already in hand.
export async function uploadClientFileBuffer(path: string, buffer: Buffer, contentType: string) {
  const { error } = await supabaseAdmin.storage.from(CLIENT_FILES_BUCKET).upload(path, buffer, {
    upsert: true,
    contentType,
  });
  if (error) throw new Error("Le téléversement a échoué.");
}

// Best-effort: callers should not fail the whole operation (e.g. deleting a
// DB row) just because the underlying object was already gone from storage.
export async function deleteClientFile(path: string) {
  await supabaseAdmin.storage.from(CLIENT_FILES_BUCKET).remove([path]);
}

// Un avatar, et le seul chemin qui en écrit un.
//
// profiles.avatar_path est lu à dix-sept endroits — la barre du haut du
// portail, la carte du chef de projet, la page Équipe, les fiches clients,
// les équipes de projet, les fils de demandes — et rien, nulle part, ne
// l'écrivait. Tous les avatars de l'application retombaient donc sur une
// initiale. Le commentaire de la colonne l'annonçait pourtant depuis la
// migration : « Null until a real photo is uploaded. »
//
// Le nom du fichier porte un horodatage plutôt qu'un chemin fixe : le
// bucket est public, donc une clé stable resterait dans le cache du
// navigateur après remplacement, et l'ancienne photo continuerait de
// s'afficher. Un nom neuf à chaque envoi évite toute question de cache ;
// l'ancien objet est supprimé derrière.
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function uploadAvatar(userId: string, file: File, previousPath: string | null): Promise<string> {
  if (!AVATAR_TYPES.includes(file.type)) {
    throw new Error("Format non accepté (JPEG, PNG, WebP ou AVIF).");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error(`Image trop lourde (${(file.size / (1024 * 1024)).toFixed(1)} Mo — 4 Mo maximum).`);
  }

  const extension = file.type === "image/jpeg" ? "jpg" : file.type.slice("image/".length);
  const path = `avatars/${userId}-${Date.now()}.${extension}`;
  const { error } = await supabaseAdmin.storage.from(PORTAL_ASSETS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error("Le téléversement a échoué.");

  // Au mieux : l'ancienne photo qui survivrait à sa remplacçante ne casse
  // rien, elle occupe de la place.
  if (previousPath) await deletePortalAsset(previousPath);
  return path;
}

export async function deletePortalAsset(path: string) {
  await supabaseAdmin.storage.from(PORTAL_ASSETS_BUCKET).remove([path]);
}

// Callers must have already verified the requesting user owns this file
// (client_id === user.id) before calling this — it does no ownership check
// itself, matching the rest of this codebase's "supabaseAdmin bypasses RLS,
// application code is the real gate" convention.
//
// `download` controls Content-Disposition on the signed URL: omitted/false
// serves the PDF inline (for viewing in a new tab), a filename string forces
// a real "Save As" download under that name.
export async function createSignedDownloadUrl(
  path: string,
  expiresInSeconds = 60,
  download?: string | boolean
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(CLIENT_FILES_BUCKET)
    .createSignedUrl(path, expiresInSeconds, download !== undefined ? { download } : undefined);
  if (error || !data) return null;
  return data.signedUrl;
}

// Signer plusieurs objets en un appel.
//
// Les trois pages qui affichent une grille de documents signaient une URL
// par vignette, dans un Promise.all : un aller-retour Storage par image,
// à chaque affichage. Supabase sait le faire en une requête ; c'est la
// même opération, en une fois.
//
// Le résultat est une Map plutôt qu'un tableau : l'API ne garantit pas
// l'ordre, et un objet manquant renvoie une entrée en erreur plutôt qu'un
// trou. L'appelant lit par chemin, donc rien ne peut se décaler.
export async function createSignedDownloadUrls(
  paths: string[],
  expiresInSeconds = 60
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return result;

  const { data, error } = await supabaseAdmin.storage
    .from(CLIENT_FILES_BUCKET)
    .createSignedUrls(unique, expiresInSeconds);
  if (error || !data) return result;

  for (const entry of data) {
    if (entry.signedUrl && entry.path) result.set(entry.path, entry.signedUrl);
  }
  return result;
}
