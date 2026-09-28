"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setOwnOnlineStatus } from "@/app/admin/actions";

// L'interrupteur « en ligne », là où on le cherche.
//
// Il existait déjà, caché dans le menu du compte en haut à droite — donc
// invisible pour qui ne l'ouvre pas. Or ce n'est pas un réglage d'affichage :
// c'est ce que vos clients lisent sur la carte « votre chef de projet » et
// sur la page Équipe de leur espace. Il mérite d'être sur l'écran des
// réglages, avec la phrase qui dit ce qu'il change.
//
// Il reste aussi dans le menu du compte : c'est de là qu'on le bascule vite.
//
// ── POURQUOI L'ADMIN DÉCIDE ET LE CLIENT NON ─────────────────────────
//
// Côté client, la présence est automatique (PresenceHeartbeat) : personne
// ne va cliquer pour dire qu'il regarde son espace. Côté studio, c'est
// l'inverse — « en ligne » veut dire « joignable maintenant », et ça ne se
// déduit pas d'un onglet ouvert. C'est une décision, donc un interrupteur.
export function OnlineToggle({ isOnline }: { isOnline: boolean }) {
  // Optimiste : la pastille suit le clic sans attendre l'aller-retour, et
  // revient si l'écriture échoue.
  const [online, setOnline] = useState(isOnline);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !online;
    setOnline(next);
    startTransition(async () => {
      try {
        await setOwnOnlineStatus(next);
        toast.success(next ? "Vous apparaissez en ligne." : "Vous apparaissez hors ligne.");
      } catch {
        setOnline(!next);
        toast.error("Le changement de statut a échoué.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm text-kov-bone">
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: online ? "#3FB27F" : "var(--kov-steel)" }}
          />
          {online ? "En ligne" : "Hors ligne"}
        </p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-kov-concrete">
          {online
            ? "Vos clients vous voient joignable sur leur tableau de bord et sur la page Équipe."
            : "Vos clients vous voient hors ligne. Ils peuvent toujours vous écrire ; vous ne paraissez simplement pas disponible dans l'instant."}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={online}
        aria-label="Apparaître en ligne auprès de vos clients"
        disabled={pending}
        onClick={toggle}
        className="relative h-7 w-12 shrink-0 transition-colors disabled:opacity-60"
        style={{
          background: online ? "rgba(63,178,127,0.35)" : "var(--kov-graphite)",
          border: `1px solid ${online ? "rgba(63,178,127,0.55)" : "var(--kov-border)"}`,
          borderRadius: "var(--radius-pill)",
        }}
      >
        <span
          aria-hidden="true"
          className="absolute top-1/2 block h-4 w-4 -translate-y-1/2 rounded-full transition-[left,background-color] duration-200"
          style={{ left: online ? "26px" : "4px", background: online ? "#3FB27F" : "var(--kov-steel)" }}
        />
      </button>
    </div>
  );
}
