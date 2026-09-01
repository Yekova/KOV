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
