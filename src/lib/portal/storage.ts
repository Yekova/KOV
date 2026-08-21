import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PORTAL_ASSETS_BUCKET = "portal-assets";
const CLIENT_FILES_BUCKET = "client-files";

export function getPublicAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const { data } = supabaseAdmin.storage.from(PORTAL_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPortalAsset(path: string, file: File) {
  const { error } = await supabaseAdmin.storage.from(PORTAL_ASSETS_BUCKET).upload(path, file, {
    upsert: true,
  });
  if (error) throw new Error("Le téléversement a échoué.");
}

export async function uploadClientFile(path: string, file: File) {
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
