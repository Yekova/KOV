import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Server-only, never import from a client component.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
