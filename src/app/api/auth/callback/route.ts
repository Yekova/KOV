import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Where an OAuth provider comes back to.
//
// Supabase hands back a one-time code in the query string; this exchanges
// it for a session and sets the cookie, then sends the visitor where the
// password form would have sent them. Nothing here is specific to a
// provider, so enabling Google, Apple or Azure in Supabase is the whole of
// the work — no second route, no second branch.

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

function back(origin: string, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, origin));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  // The provider refused, or the visitor cancelled on its screen.
  if (url.searchParams.get("error") || !code) return back(url.origin, "oauth");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return back(url.origin, "oauth");

  // This space is invitation-only.
  //
  // Accounts are created by inviteUser(), which calls generateLink({type:
  // "invite"}) — and that is the one thing that sets invited_at on the auth
  // user. Without this check, turning a provider on in Supabase would mean
  // anyone holding a Google account could sign in and land in /client with
  // the default 'client' role, because handle_new_user() gives every new
  // auth user a profile row. The guard is deliberately at the door rather
  // than in the dashboard settings, so the hole cannot be opened by a
  // toggle nobody remembers.
  //
  // The stray auth user is left in place rather than deleted: it holds no
  // session after the sign-out below, and deleting accounts from inside a
  // redirect handler is not a thing this route should decide to do.
  if (!data.user.invited_at) {
    await supabase.auth.signOut();
    return back(url.origin, "not-invited");
  }

  // Role via the service-role client, same as the password path: the read
  // must not depend on RLS behaving correctly on this project.
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  return NextResponse.redirect(new URL(next ?? (profile?.role === "admin" ? "/admin" : "/client"), url.origin));
}
