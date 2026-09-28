import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { NewRequestForm } from "./NewRequestForm";

export const metadata: Metadata = {
  title: "Messages — KOV",
};

// La colonne centrale quand aucun fil n'est ouvert.
//
// Elle ne montre plus la liste des demandes : celle-ci vit à gauche, dans
// le layout, et la répéter ici serait la même information deux fois sur le
// même écran. Elle montre ce qu'on vient faire quand on n'a pas de fil à
// lire — en ouvrir un.
export default async function ClientNewRequestPage() {
  const user = await requireUser();

  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, name")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 md:px-10">
      <h2 className="font-display text-xl uppercase text-kov-bone">
        Écrire au studio<span className="text-kov-red">.</span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-kov-concrete">
        Une question, une remarque, une demande de modification. Chaque échange reste dans sa conversation, et vous
        voyez toujours qui doit répondre.
      </p>

      <GlassCard className="mt-6 p-6" variant="solid">
        <NewRequestForm projects={projects ?? []} />
      </GlassCard>

      <p className="mt-6 text-xs text-kov-concrete">
        Le studio reçoit votre message immédiatement et vous répond dans cette même conversation.
      </p>
    </main>
  );
}
