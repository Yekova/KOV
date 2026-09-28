import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSharedEmailProvider } from "@/lib/email/resolveProvider";

export interface InviteResult {
  userId: string;
  /** Le lien à ouvrir pour activer le compte. Toujours renvoyé, même quand
   *  l'email n'est pas parti — c'est ce qui permet de le transmettre à la
   *  main plutôt que de perdre l'invitation. */
  actionLink: string;
  emailSent: boolean;
  /** Ce qui a empêché l'envoi, en clair. Null si l'email est parti. */
  emailError: string | null;
  /** Vrai quand le compte existait déjà et qu'on a régénéré un lien. */
  reinvited: boolean;
}

// Inviter quelqu'un, sans jamais perdre le compte en route.
//
// ── CE QUI N'ALLAIT PAS ──────────────────────────────────────────────
//
// generateLink() CRÉE le compte, puis on envoyait l'email. Si l'envoi
// échouait, la fonction levait — mais le compte, lui, existait déjà. La
// conversion du lead s'arrêtait donc après avoir créé un utilisateur
// orphelin : le lead restait non converti, et la tentative suivante se
// heurtait à « email_exists ». Le lead devenait inconvertible, pour
// toujours, par l'interface.
//
// Deux comptes ont été créés ainsi avant ce correctif.
//
// Trois changements en découlent :
//
// 1. Un compte qui existe déjà n'est plus une erreur. On régénère un lien
//    (type "recovery" : il mène à la création d'un mot de passe, ce que
//    l'invitation promettait de toute façon) et on continue.
//
// 2. Un email qui ne part pas n'est plus une erreur non plus. On renvoie
//    le lien et la raison de l'échec ; l'appelant décide. Perdre une
//    conversion entière parce qu'un serveur SMTP répond mal est une
//    punition sans rapport avec la faute.
//
// 3. L'envoi passe par getSharedEmailProvider() et non plus par Brevo en
//    direct. C'est le même expéditeur que le reste de l'application, donc
//    Resend dès que sa clé est valide.
export async function inviteUser({
  email,
  fullName,
  role,
  emailSubject,
  emailHtml,
}: {
  email: string;
  fullName: string | null;
  role: "client" | "admin";
  emailSubject: string;
  emailHtml: (actionLink: string) => Promise<string>;
}): Promise<InviteResult> {
  let reinvited = false;

  let { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: fullName ? { data: { full_name: fullName } } : undefined,
  });

  if (error?.code === "email_exists") {
    // Le compte existe : soit une invitation précédente dont l'email n'est
    // pas parti, soit quelqu'un déjà connu. Dans les deux cas, on veut lui
    // renvoyer de quoi entrer, pas refuser.
    reinvited = true;
    ({ data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email }));
  }

  if (error || !data?.user || !data.properties?.action_link) {
    throw new Error(error?.message ? `L'invitation a échoué : ${error.message}` : "L'invitation a échoué.");
  }

  const userId = data.user.id;
  const actionLink = data.properties.action_link;

  // handle_new_user() (voir 20260819090000_create_profiles.sql) a déjà créé
  // la ligne profiles avec role='client' — on ne la corrige que pour un
  // admin.
  if (role === "admin") {
    const { error: roleError } = await supabaseAdmin.from("profiles").update({ role: "admin" }).eq("id", userId);
    if (roleError) throw new Error("Le compte a été créé mais l'attribution du rôle admin a échoué.");
  }

  let emailSent = false;
  let emailError: string | null = null;
  try {
    await getSharedEmailProvider().send({
      to: email,
      toName: fullName ?? undefined,
      subject: emailSubject,
      html: await emailHtml(actionLink),
    });
    emailSent = true;
  } catch (caught) {
    emailError = caught instanceof Error ? caught.message : "L'envoi de l'email a échoué.";
  }

  return { userId, actionLink, emailSent, emailError, reinvited };
}
