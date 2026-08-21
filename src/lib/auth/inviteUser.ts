import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email/brevo";

// Supabase's own invite email goes through its default shared mailer, which
// is rate-limited and unbranded (this project has no custom SMTP configured
// — checked via the Management API). generateLink() creates the user and
// hands back the action link WITHOUT sending anything, so the actual email
// goes out through Brevo instead, same as every other transactional email
// in this app.
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
}): Promise<{ userId: string }> {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: fullName ? { data: { full_name: fullName } } : undefined,
  });
  if (error || !data.user) {
    throw new Error(error?.code === "email_exists" ? "Un compte existe déjà pour cet email." : "L'invitation a échoué.");
  }

  const userId = data.user.id;

  // handle_new_user() (see 20260819090000_create_profiles.sql) already
  // created the profiles row with role='client' — only patch it when the
  // invite is for an admin.
  if (role === "admin") {
    const { error: roleError } = await supabaseAdmin.from("profiles").update({ role: "admin" }).eq("id", userId);
    if (roleError) throw new Error("Le compte a été créé mais l'attribution du rôle admin a échoué.");
  }

  await sendEmail({
    to: email,
    toName: fullName ?? undefined,
    subject: emailSubject,
    html: await emailHtml(data.properties.action_link),
  });

  return { userId };
}
