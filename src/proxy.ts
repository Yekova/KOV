import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function withForwardedCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, cookie);
  });
  return to;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  const { supabaseResponse, user } = await updateSession(request);

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return withForwardedCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (isAdminPath) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/client";
      return withForwardedCookies(supabaseResponse, NextResponse.redirect(url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/client", "/client/:path*"],
};
