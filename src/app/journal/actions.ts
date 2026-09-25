"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Même garde-fou de base que api/contact/route.ts, et pour la même raison :
// cette action est publique, non authentifiée, et elle écrit dans `leads` —
// c'est-à-dire dans le pipeline commercial, badge de notification compris.
// Elle n'en avait aucun jusqu'ici.
//
// Ça arrête les robots ordinaires — remplisseurs de formulaires génériques,
// requêtes rejouées sans signal de temps — sans rien ajouter à
// l'infrastructure : une vraie limitation par IP demande Redis ou Vercel KV,
// qui ne sont pas en place. Quelqu'un qui étudierait précisément ce point
// d'entrée passerait encore.
const MIN_SUBMIT_MS = 1500;
const MAX_EMAIL_LENGTH = 254;

// Public, non authentifié — même convention que api/contact/route.ts :
// l'écriture passe par le rôle service côté serveur plutôt que de dépendre
// de la policy « insert » publique sur `leads`, qui existe en défense en
// profondeur et non comme mécanisme principal.
export async function subscribeNewsletter(input: {
  email: string;
  website: string;
  renderedAt: number;
}): Promise<{ error: string | null }> {
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const honeypot = typeof input.website === "string" ? input.website.trim() : "";
  const renderedAt = typeof input.renderedAt === "number" ? input.renderedAt : null;

  // Succès silencieux : un robot qui reçoit une réponse normale n'a aucun
  // signal sur lequel s'ajuster, contrairement à une erreur qu'il pourrait
  // utiliser pour régler sa tentative suivante.
  if (honeypot || !renderedAt || Date.now() - renderedAt < MIN_SUBMIT_MS) {
    return { error: null };
  }

  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    return { error: "Adresse email invalide." };
  }

  // Une inscription déjà enregistrée ressort en succès sans écrire. Un
  // double clic est le cas le plus courant, et il ne doit pas produire deux
  // lignes à traiter à la main dans les leads.
  const { data: existing } = await supabaseAdmin
    .from("leads")
    .select("id")
    .eq("email", email)
    .eq("source", "newsletter")
    .maybeSingle();

  if (existing) return { error: null };

  const { error } = await supabaseAdmin.from("leads").insert({
    name: email,
    email,
    message: "Inscription à la newsletter.",
    source: "newsletter",
    status: "new",
  });

  if (error) return { error: "L'inscription a échoué." };
  return { error: null };
}
