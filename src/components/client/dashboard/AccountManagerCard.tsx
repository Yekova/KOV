"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { useKovAction } from "@/lib/useKovAction";
import { Portrait } from "@/components/ui/Portrait";
import { createRequestThread } from "@/app/client/requests/actions";

type Manager = {
  full_name: string | null;
  display_title: string | null;
  avatar_url: string | null;
  is_online: boolean;
};

export function AccountManagerCard({ manager }: { manager: Manager | null }) {
  const [composing, setComposing] = useState(false);
  const action = useKovAction({
    success: "Message envoyé. Vous le retrouverez dans vos demandes.",
    fallbackError: "L'envoi a échoué.",
    // Le formulaire se referme seulement si l'envoi a abouti : le refermer
    // sur une erreur ferait disparaître le texte qu'on vient d'écrire.
    onSuccess: () => setComposing(false),
  });

  return (
    <GlassCard className="kov-portrait-host p-6 flex flex-col">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Votre chef de projet</p>

      {manager ? (
        <>
          {/* La pastille de présence a quitté la ligne du nom pour le coin du
              portrait : c'est un état de la personne, pas une ponctuation de
              son nom. Et elle était rouge — la couleur de signal du site
              pour dire « en ligne », ce qui n'est pas un signal. */}
          <div className="flex items-center gap-3 mb-6">
            <Portrait src={manager.avatar_url} name={manager.full_name} size={56} isOnline={manager.is_online} />
            <div className="min-w-0">
              <p className="text-kov-bone text-sm truncate">{manager.full_name || "—"}</p>
              <p className="text-kov-concrete text-xs mt-0.5">{manager.display_title || "Équipe KOV"}</p>
            </div>
          </div>

          {composing ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                action.run(() => createRequestThread(formData));
              }}
              className="space-y-3 mt-auto"
            >
              <input type="hidden" name="subject" value={`Message pour ${manager.full_name || "votre chef de projet"}`} />
              <textarea
                name="body"
                rows={3}
                required
                placeholder="Votre message…"
                className="kov-field w-full bg-transparent border p-3 text-sm text-kov-bone placeholder:text-kov-concrete/70 focus:outline-none"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
              />
              {action.error && (
                <p role="alert" className="text-xs" style={{ color: "var(--kov-red)" }}>
                  {action.error}
                </p>
              )}
              <KovActionButton state={action.state} onStateSettled={action.reset} className="w-full">
                Envoyer
              </KovActionButton>
            </form>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center mt-auto"
              onClick={() => setComposing(true)}
            >
              Envoyer un message
            </Button>
          )}
        </>
      ) : (
        <p className="text-kov-steel text-sm">Aucun chef de projet assigné pour l&apos;instant.</p>
      )}
    </GlassCard>
  );
}
