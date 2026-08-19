import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Plain server-side helper, not a Server Action — this is called directly
// from src/app/client/page.tsx during its own render to mark the activity
// feed as seen. It must NOT be a "use server" export: calling a Server
// Action (which internally revalidates) during the render of the very
// route being revalidated is unsupported by Next.js.
export async function markActivityRead(clientId: string) {
  await supabaseAdmin
    .from("activity_log")
    .update({ read_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .is("read_at", null);
}
