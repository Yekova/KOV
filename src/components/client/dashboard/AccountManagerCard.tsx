"use client";

import { useState, useTransition, type FormEvent } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createRequestThread(formData);
        setComposing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'envoi a échoué.");
      }
    });
  }

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
            <form onSubmit={handleSubmit} className="space-y-3 mt-auto">
              <input type="hidden" name="subject" value={`Message pour ${manager.full_name || "votre chef de projet"}`} />
              <textarea
                name="body"
                rows={3}
                required
                placeholder="Votre message…"
                className="w-full bg-transparent border p-3 text-sm text-kov-bone placeholder:text-kov-steel focus:outline-none focus:border-kov-red transition-colors"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
              />
              {error && <p className="text-kov-red text-xs">{error}</p>}
              <Button type="submit" variant="primary" className="w-full justify-center" disabled={isPending}>
                {isPending ? "Envoi…" : "Envoyer"}
              </Button>
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
