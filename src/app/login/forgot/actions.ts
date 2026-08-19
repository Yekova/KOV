"use server";

import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ForgotState = {
  status: "idle" | "sent";
  error: string | null;
};

export async function requestPasswordReset(
  _prevState: ForgotState,
  formData: FormData
): Promise<ForgotState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    return { status: "idle", error: "Merci de renseigner un email." };
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  const supabase = await createServerSupabaseClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${proto}://${host}/login/reset`,
  });

  // Always report success — whether or not this email has an account,
  // to avoid leaking which emails are registered.
  return { status: "sent", error: null };
}
