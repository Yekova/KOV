import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { inviteUser } from "@/lib/auth/inviteUser";
import { clientInviteEmailHtml, clientInviteEmailSubject } from "@/lib/email/inviteEmail";

// La création d'un client, en un seul endroit.
//
// Avant, il n'existait qu'un chemin : convertir un lead. Pour intégrer un
// client venu par recommandation, il fallait donc fabriquer un faux lead
// puis le convertir — et le menu « + Nouvelle action » affichait
// « Nouveau client · Bientôt » depuis le début.
//
// Ce module ne crée pas une seconde voie : il extrait celle qui existait
// pour que la conversion et la création directe l'empruntent toutes deux.
// La propriété qui compte reste vraie — aucune insertion directe dans
// profiles nulle part, la ligne est créée par le trigger handle_new_user()
// sur auth.users, et on ne fait que la compléter ensuite.

export interface ProvisionClientInput {
  email: string;
  fullName: string;
  company?: string | null;
  phone?: string | null;
  accountManagerId?: string | null;
}

export async function provisionClient(input: ProvisionClientInput): Promise<{ userId: string }> {
  const email = input.email.trim();
  const fullName = input.fullName.trim();
  if (!email) throw new Error("Email requis.");
  if (!fullName) throw new Error("Nom requis.");

  const { userId } = await inviteUser({
    email,
    fullName,
    role: "client",
    emailSubject: clientInviteEmailSubject(),
    emailHtml: (actionLink) => clientInviteEmailHtml({ fullName, actionLink }),
  });

  // Le responsable de compte n'est accepté que s'il est réellement
  // administrateur. La colonne ne porte pas cette contrainte en base, et
  // un lead peut avoir été assigné à quelqu'un désactivé depuis.
  let accountManagerId: string | null = null;
  if (input.accountManagerId) {
    const { data: manager } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", input.accountManagerId)
      .eq("role", "admin")
      .maybeSingle();
    accountManagerId = manager?.id ?? null;
  }

  const patch: Record<string, string | null> = {};
  if (input.company?.trim()) patch.company = input.company.trim();
  if (input.phone?.trim()) patch.phone = input.phone.trim();
  if (accountManagerId) patch.account_manager_id = accountManagerId;

  if (Object.keys(patch).length > 0) {
    await supabaseAdmin.from("profiles").update(patch).eq("id", userId);
  }

  return { userId };
}
