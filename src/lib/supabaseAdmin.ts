import "server-only";
import { createClient } from "@supabase/supabase-js";

// Admin client — bypasses RLS. Server-only, never import from a client component.
// Uses Supabase's new sb_secret_… API key (replaces the legacy service_role
// JWT — same full-access/RLS-bypass behavior, verified directly against
// this project before the switch: reads an RLS-restricted table with no
// public select policy exactly like the old key did).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false },
});
