import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Auth'd as the signed-in user (their own JWT/session cookie). This is NOT
// the service-role client — use src/lib/supabaseAdmin.ts for data reads that
// must not depend on RLS behaving correctly on this project.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component during render, where cookies
          // can't be written. Harmless as long as src/proxy.ts is refreshing
          // the session cookie on every /admin and /client request.
        }
      },
    },
  });
}
