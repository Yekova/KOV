"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { createRequestThread } from "@/app/client/requests/actions";

type Manager = {
  full_name: string | null;
  display_title: string | null;
  avatar_url: string | null;
  is_online: boolean;
};

export function AccountManagerCard({ manager }: { manager: Manager | null }) {
  const [composing, setComposing] = useState(false);

  return (
    <GlassCard className="p-6 flex flex-col">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Votre chef de projet</p>

      {manager ? (
        <>
          <div className="flex items-center gap-3 mb-6">
            <span
              className="w-12 h-12 shrink-0 overflow-hidden flex items-center justify-center text-kov-bone"
              style={{ borderRadius: "var(--radius-pill)", background: "var(--kov-graphite)" }}
            >
              {manager.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={manager.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (manager.full_name || "K").charAt(0).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <p className="text-kov-bone text-sm flex items-center gap-2">
                <span className="truncate">{manager.full_name || "—"}</span>
                <span
                  className="w-1.5 h-1.5 shrink-0"
                  style={{
                    background: manager.is_online ? "var(--kov-red)" : "var(--kov-steel)",
                    borderRadius: "var(--radius-pill)",
                  }}
                />
              </p>
              <p className="text-kov-steel text-xs">{manager.display_title || "Équipe KOV"}</p>
            </div>
          </div>

          {composing ? (
            <form
              action={createRequestThread}
              onSubmit={() => setComposing(false)}
              className="space-y-3 mt-auto"
            >
              <input type="hidden" name="subject" value={`Message pour ${manager.full_name || "votre chef de projet"}`} />
              <textarea
                name="body"
                rows={3}
                required
                placeholder="Votre message…"
                className="w-full bg-transparent border p-3 text-sm text-kov-bone placeholder:text-kov-steel focus:outline-none focus:border-kov-red transition-colors"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
              />
              <Button type="submit" variant="primary" className="w-full justify-center">
                Envoyer
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
