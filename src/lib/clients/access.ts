import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// L'état de l'espace d'un client : déduit, jamais recopié.
//
// ── CE QUI EST DÉJÀ ÉCRIT, ET OÙ ─────────────────────────────────────
//
// Le cahier des changes demandait une table client_access portant
// invitation_sent_at, activated_at, last_login_at et un statut. Les
// quatre existent déjà, tenus par Supabase lui-même :
//
//   auth.users.invited_at         → l'invitation est partie
//   auth.users.email_confirmed_at → le lien a été utilisé
//   auth.users.last_sign_in_at    → la dernière connexion
//   auth.users.banned_until       → le compte est suspendu
//   profiles.archived_at          → l'accès a été retiré
//
// Les recopier demanderait de les tenir à jour à chaque connexion, donc
// d'ajouter un chemin d'écriture sur le trajet le plus critique de
// l'application. Les lire ne demande rien, et ils ne peuvent pas mentir.
//
// Le prix : une lecture par l'API d'administration de Supabase plutôt
// qu'une jointure SQL — le schéma `auth` n'est pas exposé par PostgREST.
// C'est un appel réseau, donc les fonctions ci-dessous existent en deux
// versions : une pour un client, une pour une liste.

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

export interface ClientAccess {
  status: AccessStatus;
  invitedAt: string | null;
  activatedAt: string | null;
  lastSignInAt: string | null;
  /** Le moment où l'email d'invitation a été ouvert, quand le fournisseur
   *  l'a rapporté. Nul ne veut pas dire « pas ouvert » : beaucoup de
   *  messageries bloquent le pixel de suivi. L'interface doit le dire
   *  ainsi, jamais en déduire un désintérêt. */
  inviteOpenedAt: string | null;
}

interface AuthFacts {
  invitedAt: string | null;
  confirmedAt: string | null;
  lastSignInAt: string | null;
  bannedUntil: string | null;
}

function deriveStatus(facts: AuthFacts | null, archivedAt: string | null): AccessStatus {
  // L'archivage est une décision du studio : elle prime sur tout état du
  // compte, y compris « activé ».
  if (archivedAt) return "revoked";
  if (!facts) return "pending";
  if (facts.bannedUntil && new Date(facts.bannedUntil) > new Date()) return "suspended";
  if (facts.confirmedAt || facts.lastSignInAt) return "active";
  if (facts.invitedAt) return "invited";
  return "pending";
}

async function readAuthFacts(userId: string): Promise<AuthFacts | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  const user = data.user as unknown as Record<string, string | null | undefined>;
  return {
    invitedAt: user.invited_at ?? null,
    confirmedAt: user.email_confirmed_at ?? user.confirmed_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    bannedUntil: user.banned_until ?? null,
  };
}

/** La date d'ouverture de la dernière invitation, lue dans le journal des
 *  emails — la seule trace que l'application possède, et elle existait
 *  déjà. */
async function readInviteOpenedAt(clientId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("email_logs")
    .select("opened_at")
    .eq("client_id", clientId)
    .eq("email_type", "WELCOME_CLIENT")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.opened_at as string | null) ?? null;
}

export async function getClientAccess(clientId: string): Promise<ClientAccess> {
  const [{ data: profile }, facts, inviteOpenedAt] = await Promise.all([
    supabaseAdmin.from("profiles").select("archived_at").eq("id", clientId).maybeSingle(),
    readAuthFacts(clientId),
    readInviteOpenedAt(clientId),
  ]);

  return {
    status: deriveStatus(facts, (profile?.archived_at as string | null) ?? null),
    invitedAt: facts?.invitedAt ?? null,
    activatedAt: facts?.confirmedAt ?? null,
    lastSignInAt: facts?.lastSignInAt ?? null,
    inviteOpenedAt,
  };
}

/**
 * L'état de plusieurs clients d'un coup.
 *
 * listUsers pagine par mille : un seul appel suffit très largement ici, et
 * cela évite un aller-retour par ligne sur une page qui en affiche
 * quarante. La pagination n'est pas parcourue au-delà — le jour où ce
 * projet dépassera mille comptes, cette fonction devra le savoir, et un
 * silence serait pire qu'une limite écrite.
 */
export async function getClientAccessMap(clientIds: string[]): Promise<Map<string, AccessStatus>> {
  const result = new Map<string, AccessStatus>();
  if (clientIds.length === 0) return result;

  const wanted = new Set(clientIds);
  const [{ data: users }, { data: profiles }] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabaseAdmin.from("profiles").select("id, archived_at").in("id", clientIds),
  ]);

  const archivedById = new Map((profiles ?? []).map((p) => [p.id as string, (p.archived_at as string | null) ?? null]));
  const factsById = new Map<string, AuthFacts>();
  for (const user of users?.users ?? []) {
    if (!wanted.has(user.id)) continue;
    const raw = user as unknown as Record<string, string | null | undefined>;
    factsById.set(user.id, {
      invitedAt: raw.invited_at ?? null,
      confirmedAt: raw.email_confirmed_at ?? raw.confirmed_at ?? null,
      lastSignInAt: raw.last_sign_in_at ?? null,
      bannedUntil: raw.banned_until ?? null,
    });
  }

  for (const id of clientIds) {
    result.set(id, deriveStatus(factsById.get(id) ?? null, archivedById.get(id) ?? null));
  }
  return result;
}
