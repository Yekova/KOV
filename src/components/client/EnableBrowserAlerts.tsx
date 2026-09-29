"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";

// Le bouton qui demande l'autorisation d'alerter.
//
// Il existe parce que la demande DOIT partir d'un geste : Chrome et
// Firefox refusent une demande d'autorisation faite au chargement, et le
// refus vaut pour tout le domaine — une seule tentative automatique suffit
// à rendre les alertes impossibles ensuite.
//
// ── POURQUOI useSyncExternalStore ET PAS useState + useEffect ────────
//
// `Notification.permission` n'est pas un état de React : c'est un état DU
// NAVIGATEUR, que l'utilisateur peut changer depuis les réglages du site
// sans que la page en sache rien. Le lire dans un effet pour le recopier
// dans un état React est précisément ce que le compilateur React refuse
// (« Avoid calling setState() directly within an effect »), et il a
// raison : la copie se désynchronise dès que le réglage change ailleurs.
//
// On s'abonne donc à la source. navigator.permissions donne un objet qui
// émet « change » — le réglage modifié dans un autre onglet arrive ici
// tout seul. Le rappel manuel sert au cas où l'API n'existe pas, et juste
// après notre propre demande.

type Permission = "unsupported" | "default" | "granted" | "denied";

let listeners: (() => void)[] = [];

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void): () => void {
  listeners.push(callback);

  // Facultatif : navigator.permissions n'existe pas partout (Safari l'a
  // longtemps ignoré pour les notifications). Sans lui, on garde le
  // rappel manuel, qui couvre le seul changement qu'on provoque
  // nous-mêmes.
  let status: PermissionStatus | null = null;
  const onChange = () => emit();
  void navigator.permissions
    ?.query({ name: "notifications" as PermissionName })
    .then((result) => {
      status = result;
      result.addEventListener("change", onChange);
    })
    .catch(() => {});

  return () => {
    listeners = listeners.filter((entry) => entry !== callback);
    status?.removeEventListener("change", onChange);
  };
}

function getSnapshot(): Permission {
  return typeof Notification === "undefined" ? "unsupported" : (Notification.permission as Permission);
}

// Côté serveur, aucune notion de permission : on rend donc le cas où il
// n'y a rien à proposer, et React réconcilie après l'hydratation.
function getServerSnapshot(): Permission {
  return "unsupported";
}

export function EnableBrowserAlerts() {
  const permission = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (permission === "unsupported") return null;

  if (permission === "granted") {
    return (
      <p className="text-kov-steel border-t px-4 py-2.5 text-[11px]" style={{ borderColor: "var(--glass-border)" }}>
        Alertes du navigateur actives.
      </p>
    );
  }

  if (permission === "denied") {
    return (
      <p className="text-kov-steel border-t px-4 py-2.5 text-[11px]" style={{ borderColor: "var(--glass-border)" }}>
        {/* On ne peut plus rien demander : seul le réglage du navigateur
            revient en arrière, et le dire évite de chercher un bouton qui
            n'existe pas. */}
        Alertes bloquées par votre navigateur. Réactivez-les dans ses réglages de site.
      </p>
    );
  }

  return (
    <div className="border-t px-4 py-2.5" style={{ borderColor: "var(--glass-border)" }}>
      <button
        type="button"
        onClick={() => {
          void Notification.requestPermission().then((result) => {
            emit();
            if (result === "granted") toast.success("Vous serez prévenu même en dehors de cet onglet.");
            else if (result === "denied") toast("Alertes refusées. Réactivables dans les réglages du navigateur.");
          });
        }}
        className="text-kov-bone hover:text-kov-red text-[11px] tracking-widest uppercase transition-colors"
      >
        Être prévenu même hors de cet onglet →
      </button>
    </div>
  );
}
