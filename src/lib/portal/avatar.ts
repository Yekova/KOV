import "server-only";
import { deletePortalAsset, uploadAvatar } from "@/lib/portal/storage";

// Ce qu'un formulaire de profil doit écrire dans profiles.avatar_path.
//
// Partagé par le profil client et le profil admin, parce que c'est la même
// colonne et le même geste : les deux formulaires enregistrent un nom et
// une photo d'un seul coup.
//
// Trois retours, et la distinction compte :
//   une chaîne  → une nouvelle photo a été téléversée
//   null        → la photo a été retirée
//   undefined   → le champ n'a pas été touché, la colonne ne doit PAS être
//                 écrite. Sans ce troisième cas, enregistrer un changement
//                 de nom effacerait la photo.
export async function resolveAvatarPath(
  userId: string,
  formData: FormData,
  previousPath: string | null
): Promise<string | null | undefined> {
  if (formData.get("avatar_remove") === "1") {
    if (previousPath) await deletePortalAsset(previousPath);
    return null;
  }
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return undefined;
  return uploadAvatar(userId, file, previousPath);
}
