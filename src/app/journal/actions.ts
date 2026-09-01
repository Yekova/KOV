"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public, unauthenticated — same convention as api/contact/route.ts (writes
// via the service-role client server-side rather than relying on the
// public "insert" RLS policy on leads, which exists as defense-in-depth,
// not what this depends on). Not gated by requireAdmin(): this is the
// public newsletter signup form on /journal, anyone can call it.
export async function subscribeNewsletter(email: string): Promise<{ error: string | null }> {
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) return { error: "Adresse email invalide." };

  const { error } = await supabaseAdmin.from("leads").insert({
    name: trimmed,
    email: trimmed,
    message: "Inscription à la newsletter.",
    source: "newsletter",
    status: "new",
  });

  if (error) return { error: "L'inscription a échoué." };
  return { error: null };
}
