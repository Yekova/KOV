import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exchangeCodeForTokens, getConnectedAccountEmail } from "@/lib/auth/microsoftGraph";

const STATE_COOKIE = "ms_oauth_state";
const SETTINGS_URL = "/admin/settings";

function redirectWithStatus(origin: string, status: "connected" | "error", message?: string) {
  const url = new URL(SETTINGS_URL, origin);
  url.searchParams.set("ms_status", status);
  if (message) url.searchParams.set("ms_message", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error_description") ?? request.nextUrl.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (oauthError) return redirectWithStatus(request.nextUrl.origin, "error", oauthError);
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithStatus(request.nextUrl.origin, "error", "État OAuth invalide — réessayez.");
  }

  try {
    const redirectUri = new URL("/api/auth/microsoft/callback", request.nextUrl.origin).toString();
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.refresh_token) {
      // Happens if the app registration is missing the offline_access
      // scope's consent, or a prior connection already holds the only
      // refresh token Microsoft will issue for this admin+app pair.
      throw new Error("Microsoft n'a pas renvoyé de jeton de renouvellement — vérifiez la configuration de l'application Azure.");
    }
    const email = await getConnectedAccountEmail(tokens.access_token);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        ms_refresh_token: tokens.refresh_token,
        ms_connected_email: email,
        ms_connected_at: new Date().toISOString(),
      })
      .eq("id", admin.id);
    if (error) throw new Error("L'enregistrement de la connexion a échoué.");

    return redirectWithStatus(request.nextUrl.origin, "connected");
  } catch (err) {
    return redirectWithStatus(request.nextUrl.origin, "error", err instanceof Error ? err.message : "La connexion a échoué.");
  }
}
