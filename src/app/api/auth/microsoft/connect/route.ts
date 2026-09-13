import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/auth";
import { getMicrosoftAuthorizeUrl } from "@/lib/auth/microsoftGraph";

const STATE_COOKIE = "ms_oauth_state";

// Entry point for "Connecter Outlook" in Paramètres. Only an already-
// authenticated admin can start this flow (requireAdmin redirects/throws
// otherwise) — this route only ever attaches a Microsoft mailbox to the
// admin who's already signed into KOV, never creates or changes who that
// is.
export async function GET(request: NextRequest) {
  await requireAdmin();

  const state = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const redirectUri = new URL("/api/auth/microsoft/callback", request.nextUrl.origin).toString();
  return NextResponse.redirect(getMicrosoftAuthorizeUrl(redirectUri, state));
}
