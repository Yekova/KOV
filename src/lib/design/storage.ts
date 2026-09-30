import "server-only";
import { createSignedDownloadUrls, uploadClientFile } from "@/lib/portal/storage";
import type { Device } from "./status";

// Les maquettes vivent dans le bucket privé `client-files`, celui des
// documents. Pas de nouveau bucket : mêmes garanties, même plafond de
// 25 Mo, mêmes URL signées — et un seul endroit à surveiller.

/**
 * Une durée bien plus longue que les 60 s par défaut des téléchargements.
 *
 * Une URL de téléchargement ne vit que le temps d'un clic. Une maquette,
 * elle, reste affichée pendant qu'on la lit, qu'on zoome et qu'on écrit
 * trois retours dessus : à 60 s, l'image se serait vidée avant le premier
 * commentaire.
 */
const ASSET_TTL_SECONDS = 60 * 60;

export function designAssetPath(params: {
  projectId: string;
  pageId: string;
  versionNumber: number;
  device: Device;
  filename: string;
}): string {
  const extension = params.filename.includes(".") ? params.filename.split(".").pop()!.toLowerCase() : "png";
  // Le nom d'origine n'est pas repris dans le chemin : il vient de
  // l'utilisateur et se retrouverait dans une URL. L'appareil et la
  // version suffisent à identifier l'objet, et ils viennent de nous.
  return `projects/${params.projectId}/validation/${params.pageId}/${params.versionNumber}/${params.device}.${extension}`;
}

const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);

export async function uploadDesignAsset(path: string, file: File) {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Format non accepté. Utilisez PNG, JPEG, WebP ou AVIF.");
  }
  await uploadClientFile(path, file);
}

/** Les URL signées des chemins fournis, vides pour ceux qui échouent —
 *  une maquette manquante ne doit pas faire tomber la page entière. */
export async function signDesignAssets(paths: string[]): Promise<Map<string, string>> {
  return createSignedDownloadUrls(paths, ASSET_TTL_SECONDS);
}

/**
 * Une URL de préversion (§12) n'est affichée que si elle passe ici.
 *
 * Elle finit dans un `src` d'iframe : `javascript:` et `data:` y exécutent
 * du script dans notre origine, et `http:` ferait tomber la page en
 * contenu mixte. Seul `https:` est accepté, et le retour est ré-sérialisé
 * par URL plutôt que renvoyé tel quel.
 */
export function sanitizePreviewUrl(input: string | null | undefined): string | null {
  const raw = input?.trim();
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  return parsed.toString();
}
