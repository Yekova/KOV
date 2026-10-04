// Le statut d'un espace client, déduit — SANS "server-only".
//
// La dérivation est séparée de la lecture pour une raison : c'est elle
// qui décide de ce que le studio voit d'un compte, et une fonction qui
// importe supabaseAdmin ne peut ni être testée, ni être lue par un
// composant de navigateur. Ici il n'y a que des comparaisons.

export const ACCESS_STATUSES = ["pending", "invited", "active", "suspended", "revoked"] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const ACCESS_LABELS: Record<AccessStatus, string> = {
  pending: "Non créé",
  invited: "Invitation envoyée",
  active: "Compte activé",
  suspended: "Suspendu",
  revoked: "Accès retiré",
};

export const ACCESS_COLORS: Record<AccessStatus, string> = {
  pending: "var(--kov-steel)",
  invited: "var(--kov-status-orange)",
  active: "var(--kov-status-green)",
  suspended: "var(--kov-status-purple)",
  revoked: "var(--kov-red)",
};

/** Ce que auth.users tient sur un compte. Aucune de ces valeurs n'est
 *  écrite par l'application : Supabase les maintient seul. */
export interface AuthFacts {
  invitedAt: string | null;
  confirmedAt: string | null;
  lastSignInAt: string | null;
  bannedUntil: string | null;
}

/**
 * L'ordre des tests compte, et il n'est pas arbitraire.
 *
 * L'archivage d'abord : c'est une décision du studio, et elle prime sur
 * tout état du compte — un client archivé dont le compte reste activé
 * n'est pas « actif », il est retiré.
 *
 * La suspension ensuite, pour la même raison inverse : un compte banni
 * s'est peut-être connecté hier, ce qui ne le rend pas accessible
 * aujourd'hui.
 *
 * Puis l'activation. `lastSignInAt` compte autant que `confirmedAt` :
 * un compte créé avant que la confirmation d'email soit exigée peut
 * s'être connecté sans jamais être « confirmé ». Le considérer comme
 * simplement « invité » dirait au studio de relancer quelqu'un qui
 * utilise son espace.
 */
export function deriveAccessStatus(facts: AuthFacts | null, archivedAt: string | null, now: Date = new Date()): AccessStatus {
  if (archivedAt) return "revoked";
  if (!facts) return "pending";
  if (facts.bannedUntil && new Date(facts.bannedUntil) > now) return "suspended";
  if (facts.confirmedAt || facts.lastSignInAt) return "active";
  if (facts.invitedAt) return "invited";
  return "pending";
}
