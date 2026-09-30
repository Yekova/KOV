import "server-only";
import { deletePortalAsset, uploadAvatar } from "@/lib/portal/storage";
import { resolvePresetPath } from "@/lib/portal/avatarPresets";

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
  // Un fichier déposé l'emporte sur un avatar choisi : si les deux
  // arrivent, c'est que la personne a cliqué une vignette puis changé
  // d'avis en téléversant sa propre photo.
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    return uploadAvatar(userId, file, previousPath);
  }

  // Le choix vient du navigateur : il est confronté à la liste fermée,
  // jamais écrit tel quel. Une valeur inconnue est traitée comme une
  // absence de choix, pas comme une erreur — le reste du formulaire
  // (le nom, l'adresse) doit s'enregistrer quand même.
  const preset = resolvePresetPath(formData.get("avatar_preset"));
  if (preset) {
    if (previousPath && previousPath !== preset) await deletePortalAsset(previousPath);
    return preset;
  }

  return undefined;
}
