// Les avatars proposés au client, quand il n'a pas de photo à déposer.
//
// ── POURQUOI DES FICHIERS DU DÉPÔT, ET PAS DU BUCKET ─────────────────
//
// profiles.avatar_path contient d'ordinaire une clé d'objet du bucket
// public `portal-assets` (« avatars/<id>-<horodatage>.jpg »). Un avatar
// proposé n'appartient à personne : le mettre dans le bucket en ferait un
// fichier que la routine de remplacement supprimerait — pour tout le
// monde — au premier client qui en change.
//
// Ils sont donc servis depuis /public, versionnés avec le code, et
// `avatar_path` retient une URL relative au site. Le préfixe « / » est
// ce qui distingue les deux cas, et il est libre : aucun des chemins
// existants ne commence par une barre (vérifié en base avant d'adopter
// la convention).
//
// ── POURQUOI UNE LISTE FERMÉE ────────────────────────────────────────
//
// Le choix arrive du navigateur. Sans cette liste, un formulaire bricolé
// pourrait écrire n'importe quelle valeur dans avatar_path — par exemple
// la clé de la photo d'un autre client, qui s'afficherait alors comme la
// sienne, et que le remplacement suivant effacerait chez son
// propriétaire. Seules les sept valeurs ci-dessous sont acceptées.

export interface AvatarPreset {
  id: string;
  /** Ce qui est écrit dans profiles.avatar_path. */
  path: string;
  /** Décrit l'image, pas une personne : ce sont des illustrations, elles
   *  ne représentent personne de réel et ne reçoivent donc pas de nom. */
  label: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "kov-01", path: "/kov/avatars/kov-01.webp", label: "Portrait sur fond bleu nuit" },
  { id: "kov-02", path: "/kov/avatars/kov-02.webp", label: "Portrait sur fond sable" },
  { id: "kov-03", path: "/kov/avatars/kov-03.webp", label: "Portrait sur fond corail" },
  { id: "kov-04", path: "/kov/avatars/kov-04.webp", label: "Portrait sur fond bleu" },
  { id: "kov-05", path: "/kov/avatars/kov-05.webp", label: "Portrait sur fond vert" },
  { id: "kov-06", path: "/kov/avatars/kov-06.webp", label: "Portrait sur fond turquoise" },
  { id: "kov-07", path: "/kov/avatars/kov-07.webp", label: "Robot sur fond sable" },
];

const PRESET_PATHS = new Set(AVATAR_PRESETS.map((preset) => preset.path));

/** Vrai pour un avatar proposé — donc pour un fichier partagé, que
 *  personne ne doit supprimer en changeant de photo. */
export function isPresetAvatarPath(path: string | null | undefined): boolean {
  return typeof path === "string" && PRESET_PATHS.has(path);
}

/** Le chemin correspondant à un choix venu du navigateur, ou null si la
 *  valeur ne fait pas partie de la liste. */
export function resolvePresetPath(candidate: unknown): string | null {
  if (typeof candidate !== "string" || !candidate) return null;
  return PRESET_PATHS.has(candidate) ? candidate : null;
}
